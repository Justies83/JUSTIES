package net.justies.autoclicker

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast

/** 레이아웃 XML 없이 코드로 화면을 짜기 위한 작은 도우미들. */

fun Context.dp(v: Int) = (v * resources.displayMetrics.density).toInt()

fun Context.toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()

fun Context.text(t: String, size: Float = 15f, bold: Boolean = false, color: Int = Color.parseColor("#222222")) =
    TextView(this).apply {
        text = t
        textSize = size
        setTextColor(color)
        if (bold) setTypeface(typeface, Typeface.BOLD)
    }

fun Context.heading(t: String) = text(t, 18f, bold = true).apply { setPadding(0, dp(20), 0, dp(6)) }

fun Context.hint(t: String) = text(t, 13f, color = Color.parseColor("#666666")).apply { setPadding(0, dp(2), 0, dp(6)) }

fun Context.numField(v: String, decimal: Boolean = false, widthDp: Int = 88) = EditText(this).apply {
    inputType = InputType.TYPE_CLASS_NUMBER or (if (decimal) InputType.TYPE_NUMBER_FLAG_DECIMAL else 0)
    setText(v)
    setSingleLine()
    textSize = 15f
    layoutParams = LinearLayout.LayoutParams(dp(widthDp), LinearLayout.LayoutParams.WRAP_CONTENT)
}

fun Context.textField(v: String) = EditText(this).apply {
    inputType = InputType.TYPE_CLASS_TEXT
    setText(v)
    setSingleLine()
    textSize = 16f
}

fun Context.btn(t: String, onClick: () -> Unit) = Button(this).apply {
    text = t
    isAllCaps = false
    minWidth = 0
    minimumWidth = 0
    setPadding(dp(12), 0, dp(12), 0)
    setOnClickListener { onClick() }
}

fun Context.hrow(vararg vs: View) = LinearLayout(this).apply {
    orientation = LinearLayout.HORIZONTAL
    gravity = Gravity.CENTER_VERTICAL
    vs.forEach { addView(it) }
}

fun Context.vcol() = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }

/** 목록 한 칸을 감싸는 옅은 카드. */
fun Context.card() = vcol().apply {
    setPadding(dp(12), dp(10), dp(12), dp(8))
    background = GradientDrawable().apply {
        cornerRadius = dp(10).toFloat()
        setColor(Color.parseColor("#F1EEE7"))
    }
    layoutParams = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT,
    ).apply { bottomMargin = dp(8) }
}

/** "라벨 [입력칸] 단위" 한 줄. */
fun Context.labeled(label: String, field: View, unit: String = "") = hrow(
    text(label).apply {
        layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
    },
    field,
    text(unit, 13f, color = Color.parseColor("#666666")).apply { setPadding(dp(4), 0, 0, 0) },
)

fun EditText.long(default: Long = 0): Long = text.toString().trim().toLongOrNull() ?: default
fun EditText.int(default: Int = 0): Int = text.toString().trim().toIntOrNull() ?: default
fun EditText.float(default: Float): Float = text.toString().trim().toFloatOrNull() ?: default
