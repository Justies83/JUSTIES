package net.justies.autoclicker

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Gravity
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast

/**
 * 오버레이 패널 + 녹화 + 재생.
 *
 * 녹화: 화면 전체를 덮는 투명 창이 손가락 움직임을 받아 기록한다. 기록만 하면 아래 앱이
 * 터치를 못 받으므로, 손을 뗄 때마다 그 창을 잠깐 터치 불가로 바꾸고 같은 동작을
 * dispatchGesture() 로 아래 앱에 흘려보낸 뒤 다시 터치를 받는다.
 * 재생: 저장된 동작을 녹화 당시의 시작 시각에 맞춰 순서대로 dispatchGesture() 한다.
 */
class ClickService : AccessibilityService() {

    companion object {
        /** MainActivity 가 서비스 상태를 확인하고 패널을 다시 여는 데 쓴다. */
        var instance: ClickService? = null
            private set
    }

    private enum class Mode { IDLE, RECORDING, PLAYING }

    private lateinit var wm: WindowManager
    private val handler = Handler(Looper.getMainLooper())
    private val playToken = Any()

    private var mode = Mode.IDLE
    private var recording = Recording.EMPTY

    // 패널
    private var panel: View? = null
    private var panelParams: WindowManager.LayoutParams? = null
    private var statusView: TextView? = null

    // 녹화
    private var capture: View? = null
    private var captureParams: WindowManager.LayoutParams? = null
    private var recordStart = 0L
    private val recorded = ArrayList<Stroke>()
    private var downTime = 0L
    private val curPoints = ArrayList<Float>()

    // 재생
    private var loopStart = 0L
    private var loopsDone = 0

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        wm = getSystemService(WINDOW_SERVICE) as WindowManager
        recording = Store.load(this)
        showPanel()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    override fun onInterrupt() {}

    override fun onUnbind(intent: Intent?): Boolean {
        stopAll()
        removePanel()
        instance = null
        return super.onUnbind(intent)
    }

    /** 비상 정지: 녹화·재생 중 볼륨 아래 키. */
    override fun onKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_VOLUME_DOWN && mode != Mode.IDLE) {
            if (event.action == KeyEvent.ACTION_DOWN) stopAll()
            return true
        }
        return false
    }

    // ───────────────────────── 패널 ─────────────────────────

    private fun overlayParams(w: Int, h: Int, flags: Int) = WindowManager.LayoutParams(
        w, h,
        WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
        flags,
        PixelFormat.TRANSLUCENT,
    )

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    private fun pill(color: Int) = GradientDrawable().apply {
        cornerRadius = dp(10).toFloat()
        setColor(color)
    }

    private fun button(label: String, color: Int, onClick: () -> Unit) = TextView(this).apply {
        text = label
        textSize = 15f
        setTextColor(Color.WHITE)
        gravity = Gravity.CENTER
        setPadding(dp(12), dp(8), dp(12), dp(8))
        background = pill(color)
        setOnClickListener { onClick() }
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply { marginEnd = dp(6) }
    }

    @SuppressLint("ClickableViewAccessibility")
    fun showPanel() {
        if (panel != null) return

        val handle = TextView(this).apply {
            text = "⠿ 자동클릭"
            textSize = 13f
            setTextColor(Color.parseColor("#DDDDDD"))
            setPadding(0, 0, 0, dp(4))
        }
        val status = TextView(this).apply {
            textSize = 12f
            setTextColor(Color.WHITE)
            setPadding(0, 0, 0, dp(6))
        }
        statusView = status

        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            addView(button("● 녹화", Color.parseColor("#C0392B")) { startRecording() })
            addView(button("▶ 재생", Color.parseColor("#27AE60")) { startPlayback() })
            addView(button("■", Color.parseColor("#555555")) { stopAll() })
            addView(button("✕", Color.parseColor("#333333")) { stopAll(); removePanel() })
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(10), dp(8), dp(10), dp(10))
            background = pill(Color.parseColor("#E6202020"))
            addView(handle)
            addView(status)
            addView(row)
        }

        val p = overlayParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = dp(16)
            y = dp(120)
        }

        // 손잡이를 끌어 패널을 옮긴다.
        var startX = 0; var startY = 0; var touchX = 0f; var touchY = 0f
        handle.setOnTouchListener { _, e ->
            when (e.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    startX = p.x; startY = p.y; touchX = e.rawX; touchY = e.rawY
                }
                MotionEvent.ACTION_MOVE -> {
                    p.x = startX + (e.rawX - touchX).toInt()
                    p.y = startY + (e.rawY - touchY).toInt()
                    panel?.let { wm.updateViewLayout(it, p) }
                }
            }
            true
        }

        wm.addView(root, p)
        panel = root
        panelParams = p
        updateStatus()
    }

    private fun removePanel() {
        panel?.let { runCatching { wm.removeView(it) } }
        panel = null
        statusView = null
    }

    /** 녹화 창 위로 패널을 다시 올린다 — 나중에 추가된 창이 위에 온다. */
    private fun raisePanel() {
        val v = panel ?: return
        val p = panelParams ?: return
        runCatching { wm.removeView(v) }
        wm.addView(v, p)
    }

    private fun updateStatus() {
        val n = recording.strokes.size
        val sec = "%.1f".format(recording.totalMs / 1000.0)
        statusView?.text = when (mode) {
            Mode.IDLE ->
                if (n == 0) "녹화된 동작 없음" else "동작 ${n}개 · ${sec}초"
            Mode.RECORDING -> "녹화 중 · ${recorded.size}개"
            Mode.PLAYING -> {
                val max = Store.repeat(this)
                val total = if (max == 0) "∞" else max.toString()
                "재생 중 ${loopsDone + 1}/$total · 볼륨↓ 정지"
            }
        }
    }

    // ───────────────────────── 녹화 ─────────────────────────

    @SuppressLint("ClickableViewAccessibility")
    private fun startRecording() {
        if (mode != Mode.IDLE) stopAll()

        recorded.clear()
        curPoints.clear()
        recordStart = SystemClock.uptimeMillis()

        val v = View(this).apply {
            setBackgroundColor(Color.parseColor("#14FF0000")) // 녹화 중임을 알리는 옅은 붉은 막
            setOnTouchListener { _, e -> onCaptureTouch(e); true }
        }
        val p = overlayParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }
        wm.addView(v, p)
        capture = v
        captureParams = p
        raisePanel()

        mode = Mode.RECORDING
        updateStatus()
    }

    private fun onCaptureTouch(e: MotionEvent) {
        // 손가락 하나만 기록한다. 두 번째 손가락은 무시.
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                downTime = e.eventTime
                curPoints.clear()
                curPoints.add(e.rawX); curPoints.add(e.rawY)
            }
            MotionEvent.ACTION_MOVE -> {
                if (curPoints.isEmpty()) return
                curPoints.add(e.rawX); curPoints.add(e.rawY)
            }
            MotionEvent.ACTION_UP -> {
                if (curPoints.isEmpty()) return
                curPoints.add(e.rawX); curPoints.add(e.rawY)
                val s = Stroke(
                    startMs = downTime - recordStart,
                    durationMs = (e.eventTime - downTime).coerceAtLeast(1),
                    points = simplify(curPoints),
                )
                curPoints.clear()
                recorded.add(s)
                updateStatus()
                passThrough(s)
            }
            MotionEvent.ACTION_CANCEL -> curPoints.clear()
        }
    }

    /** 제자리에서 떨어진 점은 버리고, 거의 안 움직였으면 탭 하나로 줄인다. */
    private fun simplify(pts: List<Float>): FloatArray {
        val out = ArrayList<Float>()
        val minStep = dp(4).toFloat()
        var i = 0
        while (i < pts.size) {
            val x = pts[i]; val y = pts[i + 1]
            if (out.isEmpty()) {
                out.add(x); out.add(y)
            } else {
                val dx = x - out[out.size - 2]; val dy = y - out[out.size - 1]
                if (dx * dx + dy * dy >= minStep * minStep || i == pts.size - 2) {
                    out.add(x); out.add(y)
                }
            }
            i += 2
        }
        // 마지막 점이 첫 점과 거의 같으면 탭(또는 길게 누르기)
        if (out.size == 4) {
            val dx = out[2] - out[0]; val dy = out[3] - out[1]
            if (dx * dx + dy * dy < minStep * minStep) return floatArrayOf(out[0], out[1])
        }
        return out.toFloatArray()
    }

    /** 녹화 중 동작을 아래 앱에도 전달한다. */
    private fun passThrough(s: Stroke) {
        setCaptureTouchable(false)
        // 창 플래그 변경이 입력 시스템에 반영될 시간을 조금 준다.
        handler.postDelayed({
            if (mode != Mode.RECORDING) return@postDelayed
            dispatch(s) { if (mode == Mode.RECORDING) setCaptureTouchable(true) }
        }, 60)
    }

    private fun setCaptureTouchable(touchable: Boolean) {
        val v = capture ?: return
        val p = captureParams ?: return
        val flag = WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
        p.flags = if (touchable) p.flags and flag.inv() else p.flags or flag
        runCatching { wm.updateViewLayout(v, p) }
    }

    private fun finishRecording() {
        val total = SystemClock.uptimeMillis() - recordStart
        capture?.let { runCatching { wm.removeView(it) } }
        capture = null
        captureParams = null
        if (recorded.isNotEmpty()) {
            recording = Recording(ArrayList(recorded), total)
            Store.save(this, recording)
        } else {
            toast("녹화된 동작이 없어 이전 녹화를 유지합니다")
        }
        recorded.clear()
    }

    // ───────────────────────── 재생 ─────────────────────────

    private fun startPlayback() {
        if (mode != Mode.IDLE) stopAll()
        if (recording.strokes.isEmpty()) {
            toast("먼저 녹화하세요")
            return
        }
        loopsDone = 0
        mode = Mode.PLAYING
        updateStatus()
        playLoop()
    }

    private fun playLoop() {
        loopStart = SystemClock.uptimeMillis()
        playAt(0)
    }

    private fun playAt(i: Int) {
        if (mode != Mode.PLAYING) return
        val strokes = recording.strokes

        if (i >= strokes.size) {
            loopsDone++
            val max = Store.repeat(this)
            if (max in 1..loopsDone) {
                stopAll()
                toast("${loopsDone}회 재생 완료")
                return
            }
            updateStatus()
            // 다음 회차: 녹화 길이(정지 버튼까지) + 추가 대기 시간 뒤
            val next = maxOf(loopStart + recording.totalMs, SystemClock.uptimeMillis()) +
                Store.gapMs(this)
            handler.postAtTime({ playLoop() }, playToken, next)
            return
        }

        val s = strokes[i]
        handler.postAtTime({
            if (mode == Mode.PLAYING) dispatch(s) { playAt(i + 1) }
        }, playToken, loopStart + s.startMs)
    }

    // ───────────────────────── 공통 ─────────────────────────

    private fun dispatch(s: Stroke, done: () -> Unit) {
        val pts = s.points
        val path = Path().apply {
            moveTo(pts[0].coerceAtLeast(0f), pts[1].coerceAtLeast(0f))
            var i = 2
            while (i < pts.size) {
                lineTo(pts[i].coerceAtLeast(0f), pts[i + 1].coerceAtLeast(0f))
                i += 2
            }
        }
        val dur = s.durationMs.coerceIn(1, GestureDescription.getMaxGestureDuration())
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, dur))
            .build()
        val accepted = dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(g: GestureDescription?) = done()
            override fun onCancelled(g: GestureDescription?) = done()
        }, null)
        if (!accepted) done()
    }

    fun stopAll() {
        when (mode) {
            Mode.RECORDING -> finishRecording()
            Mode.PLAYING -> handler.removeCallbacksAndMessages(playToken)
            Mode.IDLE -> {}
        }
        mode = Mode.IDLE
        updateStatus()
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
}
