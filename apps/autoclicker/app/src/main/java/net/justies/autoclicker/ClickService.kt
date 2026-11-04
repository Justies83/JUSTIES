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
import android.widget.ScrollView
import android.widget.TextView
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.Random

/**
 * 오버레이 패널 + 녹화 + 재생.
 *
 * 녹화: 화면 전체를 덮는 투명 창이 손가락 움직임을 받아 기록한다. 기록만 하면 아래 앱이
 * 터치를 못 받으므로, 손을 뗄 때마다 그 창을 잠깐 터치 불가로 바꾸고 같은 동작을
 * dispatchGesture() 로 아래 앱에 흘려보낸 뒤 다시 터치를 받는다. 정지하면 새 모듈로 저장한다.
 *
 * 재생: 패널에서 고른 모듈 또는 조합을 Plan 으로 펼쳐, 모듈을 하나씩 꺼내 재생한다.
 * 모듈 안의 클릭은 (시작 시각 / 속도 배율 ± 흔들림) 에 맞춰 순서대로 dispatchGesture() 한다.
 */
class ClickService : AccessibilityService() {

    companion object {
        var instance: ClickService? = null
            private set
    }

    private enum class Mode { IDLE, RECORDING, PLAYING }

    private lateinit var wm: WindowManager
    private val handler = Handler(Looper.getMainLooper())
    private val playToken = Any()
    private val rnd = Random()

    private var mode = Mode.IDLE

    /** 재생·녹화를 새로 시작하거나 멈출 때마다 올린다. 이전 회차의 늦은 콜백을 무시하기 위함. */
    private var generation = 0

    // 패널
    private var panel: View? = null
    private var panelParams: WindowManager.LayoutParams? = null
    private var statusView: TextView? = null
    private var pickerScroll: ScrollView? = null
    private var pickerBox: LinearLayout? = null

    // 녹화
    private var capture: View? = null
    private var captureParams: WindowManager.LayoutParams? = null
    private var recordStart = 0L
    private val recorded = ArrayList<Stroke>()
    private var downTime = 0L
    private val curPoints = ArrayList<Float>()

    // 재생
    private var plan: Plan? = null
    private var moduleBase = 0L

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        wm = getSystemService(WINDOW_SERVICE) as WindowManager
        Store.modules(this) // 이전 버전 녹화 이전(migrate)
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

    /** 앱 화면에서 모듈·조합·선택을 바꾼 뒤 부른다. */
    fun refresh() {
        updateStatus()
        if (pickerScroll?.visibility == View.VISIBLE) rebuildPicker()
    }

    // ───────────────────────── 패널 ─────────────────────────

    private fun overlayParams(w: Int, h: Int, flags: Int) = WindowManager.LayoutParams(
        w, h,
        WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
        flags,
        PixelFormat.TRANSLUCENT,
    )

    private fun pill(color: Int) = GradientDrawable().apply {
        cornerRadius = dp(10).toFloat()
        setColor(color)
    }

    private fun panelButton(label: String, color: Int, onClick: () -> Unit) = TextView(this).apply {
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
            maxWidth = dp(260)
        }
        statusView = status

        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            addView(panelButton("●", Color.parseColor("#C0392B")) { startRecording() })
            addView(panelButton("▶", Color.parseColor("#27AE60")) { startPlayback() })
            addView(panelButton("■", Color.parseColor("#555555")) { stopAll() })
            addView(panelButton("☰", Color.parseColor("#2C6FB7")) { togglePicker() })
            addView(panelButton("✕", Color.parseColor("#333333")) { stopAll(); removePanel() })
        }

        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, dp(8), 0, 0)
        }
        pickerBox = box
        val scroll = ScrollView(this).apply {
            visibility = View.GONE
            addView(box)
        }
        pickerScroll = scroll

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(10), dp(8), dp(10), dp(10))
            background = pill(Color.parseColor("#E6202020"))
            addView(handle)
            addView(status)
            addView(row)
            addView(scroll)
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
        pickerScroll = null
        pickerBox = null
    }

    /** 녹화 창 위로 패널을 다시 올린다 — 나중에 추가된 창이 위에 온다. */
    private fun raisePanel() {
        val v = panel ?: return
        val p = panelParams ?: return
        runCatching { wm.removeView(v) }
        wm.addView(v, p)
    }

    private fun togglePicker() {
        val s = pickerScroll ?: return
        if (s.visibility == View.VISIBLE) {
            s.visibility = View.GONE
        } else {
            rebuildPicker()
            s.visibility = View.VISIBLE
        }
    }

    /** ☰ 를 누르면 펼쳐지는 모듈·조합 선택 목록. */
    private fun rebuildPicker() {
        val box = pickerBox ?: return
        val scroll = pickerScroll ?: return
        box.removeAllViews()
        val sel = Store.selected(this)
        var count = 0

        fun header(t: String) = box.addView(TextView(this).apply {
            text = t
            textSize = 11f
            setTextColor(Color.parseColor("#AAAAAA"))
            setPadding(0, dp(6), 0, dp(2))
        })

        fun entry(key: String, label: String) {
            count++
            box.addView(TextView(this).apply {
                text = (if (key == sel) "✓ " else "   ") + label
                textSize = 14f
                setTextColor(if (key == sel) Color.parseColor("#7CDB9A") else Color.WHITE)
                setPadding(dp(4), dp(7), dp(4), dp(7))
                setOnClickListener {
                    if (mode != Mode.IDLE) stopAll()
                    Store.select(this@ClickService, key)
                    scroll.visibility = View.GONE
                    updateStatus()
                }
            })
        }

        val modules = Store.modules(this)
        val combos = Store.combos(this)
        if (modules.isEmpty() && combos.isEmpty()) {
            header("저장된 모듈이 없습니다. ● 로 녹화하세요.")
        }
        if (modules.isNotEmpty()) {
            header("모듈")
            modules.forEach { entry("m:${it.id}", "${it.name}  ·  ${secs(it.playMs())}초") }
        }
        if (combos.isNotEmpty()) {
            header("조합")
            combos.forEach { entry("c:${it.id}", it.name) }
        }

        scroll.layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            if (count > 6) dp(260) else LinearLayout.LayoutParams.WRAP_CONTENT,
        )
    }

    private fun updateStatus() {
        statusView?.text = when (mode) {
            Mode.IDLE -> Store.selectedName(this)?.let { "선택: $it" } ?: "☰ 에서 재생할 모듈을 고르세요"
            Mode.RECORDING -> "녹화 중 · ${recorded.size}개"
            Mode.PLAYING -> (plan?.status() ?: "재생 중") + "\n볼륨↓ 정지"
        }
    }

    // ───────────────────────── 녹화 ─────────────────────────

    @SuppressLint("ClickableViewAccessibility")
    private fun startRecording() {
        if (mode != Mode.IDLE) stopAll()
        pickerScroll?.visibility = View.GONE

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

        generation++
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
        if (out.size == 4) {
            val dx = out[2] - out[0]; val dy = out[3] - out[1]
            if (dx * dx + dy * dy < minStep * minStep) return floatArrayOf(out[0], out[1])
        }
        return out.toFloatArray()
    }

    /** 녹화 중 동작을 아래 앱에도 전달한다. */
    private fun passThrough(s: Stroke) {
        val gen = generation
        setCaptureTouchable(false)
        // 창 플래그 변경이 입력 시스템에 반영될 시간을 조금 준다.
        handler.postDelayed({
            if (gen != generation) return@postDelayed
            dispatch(s.points, s.durationMs) { if (gen == generation) setCaptureTouchable(true) }
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
            val name = "녹화 " + SimpleDateFormat("MM-dd HH:mm", Locale.KOREA).format(Date())
            val m = Module(Store.newId(), name, ArrayList(recorded), total)
            Store.saveModule(this, m)
            Store.select(this, "m:${m.id}")
            toast("‘$name’ 저장 — 앱에서 이름·시간을 고칠 수 있습니다")
        } else {
            toast("녹화된 동작이 없습니다")
        }
        recorded.clear()
    }

    // ───────────────────────── 재생 ─────────────────────────

    /** 재생 순서. items 의 각 모듈을 정해진 횟수만큼, 전체를 loops 번(0 = 무한) 돈다. */
    private class Plan(val title: String, val items: List<Pair<Module, Int>>, val loops: Int) {
        private var loop = 0
        private var idx = 0
        private var rep = 0

        fun next(): Module? {
            while (true) {
                if (idx >= items.size) {
                    loop++
                    if (loops > 0 && loop >= loops) return null
                    idx = 0
                    rep = 0
                }
                val (m, r) = items[idx]
                if (rep < r) {
                    rep++
                    return m
                }
                idx++
                rep = 0
            }
        }

        fun status(): String {
            val total = if (loops == 0) "∞" else loops.toString()
            val head = "$title ${loop + 1}/$total"
            if (items.size == 1 && items[0].second == 1) return head
            val (m, r) = items[idx.coerceAtMost(items.size - 1)]
            return "$head\n${idx + 1}번째 ${m.name} ${rep}/$r"
        }
    }

    private fun buildPlan(): Plan? {
        var key = Store.selected(this)
        if (key == null) {
            val first = Store.modules(this).firstOrNull() ?: return null
            key = "m:${first.id}"
            Store.select(this, key)
        }
        val id = key.substring(2)
        return when {
            key.startsWith("m:") -> Store.module(this, id)?.let { Plan(it.name, listOf(it to 1), Store.repeat(this)) }
            key.startsWith("c:") -> Store.combo(this, id)?.let { c ->
                val items = c.items.mapNotNull { item ->
                    Store.module(this, item.moduleId)?.let { it to item.repeat.coerceAtLeast(1) }
                }
                if (items.isEmpty()) null else Plan(c.name, items, c.repeat.coerceAtLeast(0))
            }
            else -> null
        }
    }

    private fun startPlayback() {
        if (mode != Mode.IDLE) stopAll()
        pickerScroll?.visibility = View.GONE
        val p = buildPlan()
        if (p == null) {
            toast("재생할 모듈이 없습니다. ● 로 녹화하거나 ☰ 에서 고르세요")
            return
        }
        generation++
        plan = p
        mode = Mode.PLAYING
        nextModule(generation)
    }

    private fun nextModule(gen: Int) {
        if (gen != generation || mode != Mode.PLAYING) return
        val m = plan?.next()
        if (m == null) {
            stopAll()
            toast("재생 완료")
            return
        }
        updateStatus()
        moduleBase = SystemClock.uptimeMillis() + m.preDelayMs
        playStroke(gen, m, 0)
    }

    private fun playStroke(gen: Int, m: Module, i: Int) {
        if (gen != generation || mode != Mode.PLAYING) return
        val speed = m.speed.coerceIn(0.1f, 10f)
        val now = SystemClock.uptimeMillis()

        if (i >= m.strokes.size) {
            val end = maxOf(moduleBase + (m.totalMs / speed).toLong(), now) + m.postDelayMs
            // 길이 0 인 모듈만으로 무한 반복할 때 메인 스레드를 붙잡지 않도록 최소 간격을 둔다.
            handler.postAtTime({ nextModule(gen) }, playToken, maxOf(end, now + 16))
            return
        }

        val s = m.strokes[i]
        val jitter = if (m.jitterMs > 0) rnd.nextInt((2 * m.jitterMs + 1).toInt()) - m.jitterMs else 0L
        val at = moduleBase + (s.startMs / speed).toLong() + jitter
        val dur = (s.durationMs / speed).toLong().coerceAtLeast(1)
        handler.postAtTime({
            if (gen == generation) dispatch(s.points, dur) { playStroke(gen, m, i + 1) }
        }, playToken, at)
    }

    // ───────────────────────── 공통 ─────────────────────────

    private fun dispatch(pts: FloatArray, durationMs: Long, done: () -> Unit) {
        val path = Path().apply {
            moveTo(pts[0].coerceAtLeast(0f), pts[1].coerceAtLeast(0f))
            var i = 2
            while (i < pts.size) {
                lineTo(pts[i].coerceAtLeast(0f), pts[i + 1].coerceAtLeast(0f))
                i += 2
            }
        }
        val dur = durationMs.coerceIn(1, GestureDescription.getMaxGestureDuration())
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
        generation++
        plan = null
        mode = Mode.IDLE
        updateStatus()
    }
}
