package net.justies.autoclicker

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView

/**
 * 모듈 하나의 시간 조정.
 *
 * 클릭 시각은 파일에 "모듈 시작부터의 절대 시각"으로 저장되지만, 사람이 고치기 쉬운 건
 * "앞 클릭과의 간격"이라 화면에서는 간격으로 풀어 보여 주고 저장할 때 다시 누적한다.
 */
class ModuleEditActivity : Activity() {

    private lateinit var module: Module

    // 편집 중인 값. 줄을 지우거나 다시 그릴 때 입력칸 → 여기로 먼저 옮긴다.
    private val gaps = ArrayList<Long>()
    private val durs = ArrayList<Long>()
    private val points = ArrayList<FloatArray>()
    private var tail = 0L

    private lateinit var nameField: EditText
    private lateinit var speedField: EditText
    private lateinit var preField: EditText
    private lateinit var postField: EditText
    private lateinit var jitterField: EditText
    private lateinit var tailField: EditText
    private val gapFields = ArrayList<EditText>()
    private val durFields = ArrayList<EditText>()
    private lateinit var list: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val m = intent.getStringExtra("id")?.let { Store.module(this, it) }
        if (m == null) { toast("모듈을 찾을 수 없습니다"); finish(); return }
        module = m

        var prev = 0L
        m.strokes.forEach { s ->
            gaps.add(s.startMs - prev); durs.add(s.durationMs); points.add(s.points)
            prev = s.startMs
        }
        tail = (m.totalMs - prev).coerceAtLeast(0)

        val page = vcol().apply { setPadding(dp(20), dp(24), dp(20), dp(28)) }

        page.addView(hrow(
            text("모듈 편집", 22f, bold = true).apply {
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            },
            btn("저장") { save() },
        ))
        nameField = textField(m.name)
        page.addView(nameField)

        page.addView(heading("전체 조정"))
        speedField = numField(String.format(java.util.Locale.US, "%.2f", m.speed), decimal = true)
        preField = numField(m.preDelayMs.toString())
        postField = numField(m.postDelayMs.toString())
        jitterField = numField(m.jitterMs.toString())
        page.addView(labeled("속도 배율 (0.1–10)", speedField, "×"))
        page.addView(hint("2.00 이면 두 배 빠르게. 간격과 누름 시간이 모두 줄어듭니다."))
        page.addView(labeled("시작 전 대기", preField, "ms"))
        page.addView(labeled("끝난 뒤 대기", postField, "ms"))
        page.addView(labeled("랜덤 흔들림 ±", jitterField, "ms"))
        page.addView(hint("클릭마다 시작 시각을 이 범위 안에서 무작위로 앞당기거나 늦춥니다."))

        page.addView(heading("클릭 목록"))
        page.addView(hint("간격 = 앞 클릭이 시작된 뒤 이 클릭이 시작되기까지. 첫 줄은 모듈 시작부터. 속도 배율 적용 전 값입니다.\n줄을 지우면 그 간격은 다음 줄로 넘어가 나머지 클릭의 시각은 그대로 유지됩니다."))
        page.addView(hrow(
            btn("모든 간격 −10%") { scaleGaps(0.9) },
            btn("+10%") { scaleGaps(1.1) },
        ))
        list = vcol()
        page.addView(list)

        tailField = numField(tail.toString())
        page.addView(labeled("마지막 클릭 후 대기", tailField, "ms"))
        page.addView(hint("한 회 길이 = 모든 간격 합 + 이 값. 녹화 때 ■ 를 누르기까지 걸린 시간입니다."))
        page.addView(btn("저장") { save() })

        renderList()
        setContentView(ScrollView(this).apply {
            setBackgroundColor(Color.parseColor("#F8F6F1"))
            addView(page, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        })
    }

    /** 입력칸의 값을 편집 상태로 옮긴다. */
    private fun commit() {
        for (i in gaps.indices) {
            gaps[i] = gapFields[i].long(gaps[i]).coerceAtLeast(0)
            durs[i] = durFields[i].long(durs[i]).coerceAtLeast(1)
        }
    }

    private fun renderList() {
        list.removeAllViews()
        gapFields.clear(); durFields.clear()
        if (gaps.isEmpty()) list.addView(hint("클릭이 없습니다."))
        for (i in gaps.indices) {
            val s = Stroke(0, 0, points[i])
            val gap = numField(gaps[i].toString(), widthDp = 84)
            val dur = numField(durs[i].toString(), widthDp = 72)
            gapFields.add(gap); durFields.add(dur)
            list.addView(card().apply {
                addView(hrow(
                    text("#${i + 1}  ${s.describe()}", 14f, bold = true).apply {
                        layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                    },
                    btn("✕") { removeAt(i) },
                ))
                addView(hrow(text("간격 ", 14f), gap, text(" ms   누름 ", 14f), dur, text(" ms", 14f)))
            })
        }
    }

    private fun removeAt(i: Int) {
        commit()
        if (i + 1 < gaps.size) gaps[i + 1] += gaps[i]
        else tail = tailField.long(tail) + gaps[i]
        gaps.removeAt(i); durs.removeAt(i); points.removeAt(i)
        tailField.setText(tail.toString())
        renderList()
    }

    private fun scaleGaps(f: Double) {
        commit()
        for (i in gaps.indices) gaps[i] = (gaps[i] * f).toLong()
        tail = (tailField.long(tail) * f).toLong()
        tailField.setText(tail.toString())
        renderList()
    }

    private fun save() {
        commit()
        tail = tailField.long(tail).coerceAtLeast(0)
        var t = 0L
        val strokes = gaps.indices.map { i ->
            t += gaps[i]
            Stroke(t, durs[i], points[i])
        }
        module.name = nameField.text.toString().trim().ifEmpty { module.name }
        module.strokes = strokes
        module.totalMs = t + tail
        module.speed = speedField.float(module.speed).coerceIn(0.1f, 10f)
        module.preDelayMs = preField.long().coerceAtLeast(0)
        module.postDelayMs = postField.long().coerceAtLeast(0)
        module.jitterMs = jitterField.long().coerceAtLeast(0)
        Store.saveModule(this, module)
        ClickService.instance?.refresh()
        toast("저장했습니다 · 한 회 ${secs(module.playMs())}초")
        finish()
    }
}
