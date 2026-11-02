package net.justies.autoclicker

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.provider.Settings
import android.text.InputType
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast

/** 권한 안내와 반복 설정만 담당한다. 녹화·재생은 오버레이 패널에서 한다. */
class MainActivity : Activity() {

    private lateinit var serviceState: TextView
    private lateinit var repeatInput: EditText
    private lateinit var gapInput: EditText

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val col = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(32), dp(20), dp(20))
        }
        fun label(t: String, size: Float = 15f) = TextView(this).apply {
            text = t; textSize = size; setTextColor(Color.parseColor("#222222"))
            setPadding(0, dp(12), 0, dp(4))
        }

        col.addView(label("자동클릭", 24f))
        serviceState = label("")
        col.addView(serviceState)

        col.addView(Button(this).apply {
            text = "1. 접근성 설정 열기"
            setOnClickListener { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }
        })
        col.addView(label("설정 → 설치된 앱(또는 다운로드한 앱) → 자동클릭 → 사용. 켜면 패널이 바로 뜹니다.", 13f))

        col.addView(Button(this).apply {
            text = "2. 패널 열기"
            setOnClickListener {
                val s = ClickService.instance
                if (s == null) toast("먼저 접근성에서 자동클릭을 켜세요")
                else { s.showPanel(); moveTaskToBack(true) }
            }
        })

        col.addView(label("반복 횟수 (0 = 무한)"))
        repeatInput = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER
            setText(Store.repeat(this@MainActivity).toString())
        }
        col.addView(repeatInput)

        col.addView(label("회차 사이 추가 대기 (ms)"))
        gapInput = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER
            setText(Store.gapMs(this@MainActivity).toString())
        }
        col.addView(gapInput)

        col.addView(Button(this).apply {
            text = "설정 저장"
            setOnClickListener {
                val r = repeatInput.text.toString().toIntOrNull() ?: 0
                val g = gapInput.text.toString().toLongOrNull() ?: 0L
                Store.saveSettings(this@MainActivity, r.coerceAtLeast(0), g.coerceAtLeast(0))
                toast("저장했습니다")
            }
        })

        col.addView(label(
            "사용법\n" +
                "● 녹화: 화면에 옅은 붉은 막이 덮입니다. 평소처럼 누르면 기록되면서 아래 앱에도 전달됩니다.\n" +
                "■ 정지: 녹화를 끝냅니다. 정지를 누른 시점까지가 한 회차 길이입니다.\n" +
                "▶ 재생: 녹화한 시간 간격 그대로 반복합니다.\n" +
                "볼륨 아래 키: 재생·녹화 비상 정지.\n" +
                "패널 자리로 재생 터치가 떨어지면 패널이 대신 눌리니, 손잡이(⠿)를 끌어 비켜 두세요.",
            13f,
        ))

        setContentView(ScrollView(this).apply {
            addView(col, ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT,
            ))
        })
    }

    override fun onResume() {
        super.onResume()
        serviceState.text = if (ClickService.instance != null)
            "접근성 서비스: 켜짐" else "접근성 서비스: 꺼짐 — 아래 1번으로 켜세요"
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
}
