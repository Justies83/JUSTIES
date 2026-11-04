package net.justies.autoclicker

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Spinner

/** 조합 만들기·고치기. 칸마다 모듈 하나와 반복 횟수. */
class ComboEditActivity : Activity() {

    private lateinit var combo: Combo
    private lateinit var modules: List<Module>

    private lateinit var nameField: EditText
    private lateinit var repeatField: EditText
    private lateinit var list: LinearLayout
    private val spinners = ArrayList<Spinner>()
    private val repeatFields = ArrayList<EditText>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        modules = Store.modules(this)
        if (modules.isEmpty()) { toast("먼저 모듈을 녹화하세요"); finish(); return }

        val existing = intent.getStringExtra("id")?.let { Store.combo(this, it) }
        combo = existing ?: Combo(
            Store.newId(),
            "조합 ${Store.combos(this).size + 1}",
            mutableListOf(ComboItem(modules[0].id, 1)),
            1,
        )
        // 지워진 모듈을 가리키는 칸은 버린다.
        val ids = modules.map { it.id }.toSet()
        combo.items.removeAll { it.moduleId !in ids }

        val page = vcol().apply { setPadding(dp(20), dp(24), dp(20), dp(28)) }
        page.addView(hrow(
            text(if (existing == null) "새 조합" else "조합 편집", 22f, bold = true).apply {
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            },
            btn("저장") { save() },
        ))
        nameField = textField(combo.name)
        page.addView(nameField)
        repeatField = numField(combo.repeat.toString(), widthDp = 72)
        page.addView(labeled("전체 반복 (0 = 무한)", repeatField, "회"))

        page.addView(heading("순서"))
        page.addView(hint("위에서 아래로 재생합니다. 각 칸의 모듈은 정한 횟수만큼 연속 반복합니다."))
        list = vcol()
        page.addView(list)
        page.addView(btn("+ 모듈 추가") {
            commit()
            combo.items.add(ComboItem(modules[0].id, 1))
            renderList()
        })
        page.addView(btn("저장") { save() })

        renderList()
        setContentView(ScrollView(this).apply {
            setBackgroundColor(Color.parseColor("#F8F6F1"))
            addView(page, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        })
    }

    private fun commit() {
        for (i in combo.items.indices) {
            combo.items[i].moduleId = modules[spinners[i].selectedItemPosition.coerceAtLeast(0)].id
            combo.items[i].repeat = repeatFields[i].int(1).coerceAtLeast(1)
        }
    }

    private fun renderList() {
        list.removeAllViews()
        spinners.clear(); repeatFields.clear()
        val names = modules.map { "${it.name}  (${secs(it.playMs())}초)" }

        combo.items.forEachIndexed { i, item ->
            val spinner = Spinner(this).apply {
                adapter = ArrayAdapter(this@ComboEditActivity, android.R.layout.simple_spinner_dropdown_item, names)
                setSelection(modules.indexOfFirst { it.id == item.moduleId }.coerceAtLeast(0))
            }
            val rep = numField(item.repeat.toString(), widthDp = 64)
            spinners.add(spinner); repeatFields.add(rep)

            list.addView(card().apply {
                addView(text("${i + 1}번째", 13f, bold = true))
                addView(spinner)
                addView(hrow(
                    text("반복 ", 14f), rep, text(" 회", 14f).apply {
                        layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                    },
                    btn("↑") { move(i, -1) },
                    btn("↓") { move(i, 1) },
                    btn("✕") { commit(); combo.items.removeAt(i); renderList() },
                ))
            })
        }
        if (combo.items.isEmpty()) list.addView(hint("비어 있습니다. + 모듈 추가를 누르세요."))
    }

    private fun move(i: Int, d: Int) {
        val j = i + d
        if (j !in combo.items.indices) return
        commit()
        val t = combo.items[i]; combo.items[i] = combo.items[j]; combo.items[j] = t
        renderList()
    }

    private fun save() {
        commit()
        if (combo.items.isEmpty()) { toast("모듈을 하나 이상 넣으세요"); return }
        combo.name = nameField.text.toString().trim().ifEmpty { combo.name }
        combo.repeat = repeatField.int(1).coerceAtLeast(0)
        Store.saveCombo(this, combo)
        Store.select(this, "c:${combo.id}")
        ClickService.instance?.refresh()
        toast("저장하고 재생 대상으로 선택했습니다")
        finish()
    }
}
