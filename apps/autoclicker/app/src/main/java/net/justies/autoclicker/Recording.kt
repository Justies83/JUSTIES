package net.justies.autoclicker

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/** 손가락 하나가 닿았다 떨어질 때까지의 한 동작. 좌표는 화면 절대 좌표(px). */
class Stroke(
    /** 녹화 시작부터 이 동작이 시작되기까지의 시간(ms). */
    val startMs: Long,
    /** 닿아 있던 시간(ms). 길게 누르기·스와이프 속도가 여기서 재현된다. */
    val durationMs: Long,
    /** x0, y0, x1, y1, ... */
    val points: FloatArray,
)

/** 녹화 한 벌. totalMs 는 녹화 시작부터 정지 버튼까지 — 한 회차의 길이. */
class Recording(val strokes: List<Stroke>, val totalMs: Long) {

    fun toJson(): String = JSONObject().apply {
        put("total", totalMs)
        put("strokes", JSONArray().apply {
            strokes.forEach { s ->
                put(JSONObject().apply {
                    put("s", s.startMs)
                    put("d", s.durationMs)
                    put("p", JSONArray().apply { s.points.forEach { put(it.toDouble()) } })
                })
            }
        })
    }.toString()

    companion object {
        val EMPTY = Recording(emptyList(), 0)

        fun fromJson(text: String): Recording {
            val o = JSONObject(text)
            val arr = o.getJSONArray("strokes")
            val list = ArrayList<Stroke>(arr.length())
            for (i in 0 until arr.length()) {
                val s = arr.getJSONObject(i)
                val p = s.getJSONArray("p")
                list.add(Stroke(
                    s.getLong("s"),
                    s.getLong("d"),
                    FloatArray(p.length()) { p.getDouble(it).toFloat() },
                ))
            }
            return Recording(list, o.getLong("total"))
        }
    }
}

object Store {
    private fun file(ctx: Context) = File(ctx.filesDir, "recording.json")
    private fun prefs(ctx: Context) = ctx.getSharedPreferences("settings", Context.MODE_PRIVATE)

    fun load(ctx: Context): Recording = try {
        val f = file(ctx)
        if (f.exists()) Recording.fromJson(f.readText()) else Recording.EMPTY
    } catch (e: Exception) {
        Recording.EMPTY
    }

    fun save(ctx: Context, r: Recording) = file(ctx).writeText(r.toJson())

    /** 반복 횟수. 0 이면 무한. */
    fun repeat(ctx: Context): Int = prefs(ctx).getInt("repeat", 0)

    /** 회차 사이에 추가로 쉬는 시간(ms). */
    fun gapMs(ctx: Context): Long = prefs(ctx).getLong("gap", 0L)

    fun saveSettings(ctx: Context, repeat: Int, gapMs: Long) {
        prefs(ctx).edit().putInt("repeat", repeat).putLong("gap", gapMs).apply()
    }
}
