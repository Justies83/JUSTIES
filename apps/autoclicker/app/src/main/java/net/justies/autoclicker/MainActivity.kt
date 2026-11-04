package net.justies.autoclicker

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.provider.Settings
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.ScrollView

/** 권한 안내 + 모듈·조합 목록. 녹화·재생 자체는 오버레이 패널에서 한다. */
class MainActivity : Activity() {

    private lateinit var page: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        page = vcol().apply { setPadding(dp(20), dp(28), dp(20), dp(28)) }
        setContentView(ScrollView(this).apply {
            setBackgroundColor(Color.parseColor("#F8F6F1"))
            addView(page, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        })
    }

    override fun onResume() {
        super.onResume()
        render()
    }

    private fun changed() {
        ClickService.instance?.refresh()
        render()
    }

    private fun render() {
        page.removeAllViews()
        val service = ClickService.instance
        val selected = Store.selected(this)

        page.addView(text("자동클릭", 24f, bold = true))
        page.addView(hint(if (service != null) "접근성 서비스: 켜짐" else "접근성 서비스: 꺼짐 — 아래 버튼으로 켜세요"))
        page.addView(hrow(
            btn("접근성 설정") { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) },
            btn("패널 열기") {
                val s = ClickService.instance
                if (s == null) toast("먼저 접근성에서 자동클릭을 켜세요")
                else { s.showPanel(); moveTaskToBack(true) }
            },
        ))

        // ── 모듈 ──
        page.addView(heading("모듈"))
        val repeatField = numField(Store.repeat(this).toString(), widthDp = 72)
        page.addView(hrow(
            text("단독 재생 반복 (0 = 무한)").apply {
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            },
            repeatField,
            btn("저장") {
                Store.setRepeat(this, repeatField.int().coerceAtLeast(0))
                toast("저장했습니다"); changed()
            },
        ))

        val modules = Store.modules(this)
        if (modules.isEmpty()) page.addView(hint("아직 없습니다. 패널의 ● 로 녹화하면 여기에 쌓입니다."))
        modules.forEach { m ->
            val key = "m:${m.id}"
            page.addView(card().apply {
                addView(text((if (key == selected) "✓ " else "") + m.name, 16f, bold = true))
                addView(hint(m.summary()))
                addView(hrow(
                    btn(if (key == selected) "선택됨" else "선택") { Store.select(this@MainActivity, key); changed() },
                    btn("편집") {
                        startActivity(Intent(this@MainActivity, ModuleEditActivity::class.java).putExtra("id", m.id))
                    },
                    btn("복제") {
                        Store.saveModule(this@MainActivity, m.copy(Store.newId(), m.name + " 사본")); changed()
                    },
                    btn("삭제") {
                        confirm("‘${m.name}’ 모듈을 지울까요? 이 모듈을 쓰는 조합에서도 빠집니다.") {
                            Store.deleteModule(this@MainActivity, m.id); changed()
                        }
                    },
                ))
            })
        }

        // ── 조합 ──
        page.addView(heading("조합"))
        page.addView(hint("모듈을 순서대로 이어 붙여 한 번에 재생합니다."))
        page.addView(btn("+ 새 조합") {
            if (modules.isEmpty()) toast("먼저 모듈을 녹화하세요")
            else startActivity(Intent(this, ComboEditActivity::class.java))
        })
        val names = modules.associate { it.id to it.name }
        Store.combos(this).forEach { c ->
            val key = "c:${c.id}"
            val flow = c.items.joinToString(" → ") { (names[it.moduleId] ?: "(삭제됨)") + if (it.repeat > 1) "×${it.repeat}" else "" }
            page.addView(card().apply {
                addView(text((if (key == selected) "✓ " else "") + c.name, 16f, bold = true))
                addView(hint("$flow\n전체 반복 ${if (c.repeat == 0) "무한" else "${c.repeat}회"}"))
                addView(hrow(
                    btn(if (key == selected) "선택됨" else "선택") { Store.select(this@MainActivity, key); changed() },
                    btn("편집") {
                        startActivity(Intent(this@MainActivity, ComboEditActivity::class.java).putExtra("id", c.id))
                    },
                    btn("삭제") {
                        confirm("‘${c.name}’ 조합을 지울까요? 모듈은 그대로 남습니다.") {
                            Store.deleteCombo(this@MainActivity, c.id); changed()
                        }
                    },
                ))
            })
        }

        page.addView(heading("사용법"))
        page.addView(hint(
            "● 녹화 — 붉은 막이 덮이면 평소처럼 누르세요. 아래 앱에도 전달됩니다. ■ 를 누르면 새 모듈로 저장됩니다.\n" +
                "▶ 재생 — 선택된 모듈(또는 조합)을 녹화한 시간 간격대로 재생합니다.\n" +
                "☰ — 패널에서 재생할 모듈·조합을 바꿉니다.\n" +
                "볼륨 아래 키 — 비상 정지.\n" +
                "재생 터치가 패널 자리에 떨어지면 패널이 대신 눌리니 손잡이(⠿)로 비켜 두세요."
        ))
    }

    private fun confirm(msg: String, yes: () -> Unit) {
        AlertDialog.Builder(this)
            .setMessage(msg)
            .setPositiveButton("삭제") { _, _ -> yes() }
            .setNegativeButton("취소", null)
            .show()
    }
}
