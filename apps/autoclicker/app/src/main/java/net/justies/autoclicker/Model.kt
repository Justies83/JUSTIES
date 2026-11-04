package net.justies.autoclicker

import org.json.JSONArray
import org.json.JSONObject

/** 손가락 하나가 닿았다 떨어질 때까지의 한 동작. 좌표는 화면 절대 좌표(px). */
class Stroke(
    /** 모듈 시작부터 이 동작이 시작되기까지의 시간(ms). */
    val startMs: Long,
    /** 닿아 있던 시간(ms). */
    val durationMs: Long,
    /** x0, y0, x1, y1, ... 점이 하나면 탭(또는 길게 누르기). */
    val points: FloatArray,
) {
    val isTap get() = points.size == 2

    fun describe(): String {
        val x0 = points[0].toInt(); val y0 = points[1].toInt()
        if (isTap) return "탭 ($x0, $y0)"
        val x1 = points[points.size - 2].toInt(); val y1 = points[points.size - 1].toInt()
        return "스와이프 ($x0, $y0)→($x1, $y1)"
    }

    fun toJson() = JSONObject().apply {
        put("s", startMs)
        put("d", durationMs)
        put("p", JSONArray().apply { points.forEach { put(it.toDouble()) } })
    }

    companion object {
        fun fromJson(o: JSONObject): Stroke {
            val p = o.getJSONArray("p")
            return Stroke(o.getLong("s"), o.getLong("d"), FloatArray(p.length()) { p.getDouble(it).toFloat() })
        }

        fun listFromJson(arr: JSONArray) = List(arr.length()) { fromJson(arr.getJSONObject(it)) }
    }
}

/** 녹화 한 벌 + 재생 시간 조정값. */
class Module(
    val id: String,
    var name: String,
    var strokes: List<Stroke>,
    /** 모듈 시작부터 끝(녹화 정지 시점)까지(ms). 마지막 클릭 뒤 대기 시간이 여기에 포함된다. */
    var totalMs: Long,
    /** 재생 속도 배율. 2.0 이면 모든 간격과 누름 시간이 절반. */
    var speed: Float = 1f,
    /** 모듈 시작 전 대기(ms). */
    var preDelayMs: Long = 0,
    /** 모듈 끝난 뒤 대기(ms). */
    var postDelayMs: Long = 0,
    /** 클릭마다 시작 시각을 ±이 범위에서 무작위로 흔든다(ms). */
    var jitterMs: Long = 0,
    val created: Long = System.currentTimeMillis(),
) {
    /** 속도와 앞뒤 대기를 반영한 1회 재생 길이. */
    fun playMs(): Long = preDelayMs + (totalMs / speed).toLong() + postDelayMs

    fun summary(): String {
        val sp = if (speed == 1f) "" else " · ${"%.2f".format(speed)}×"
        return "클릭 ${strokes.size}개 · ${secs(playMs())}초$sp"
    }

    fun copy(newId: String, newName: String) = Module(
        newId, newName, strokes, totalMs, speed, preDelayMs, postDelayMs, jitterMs,
    )

    fun toJson(): String = JSONObject().apply {
        put("id", id)
        put("name", name)
        put("total", totalMs)
        put("speed", speed.toDouble())
        put("pre", preDelayMs)
        put("post", postDelayMs)
        put("jitter", jitterMs)
        put("created", created)
        put("strokes", JSONArray().apply { strokes.forEach { put(it.toJson()) } })
    }.toString()

    companion object {
        fun fromJson(text: String): Module {
            val o = JSONObject(text)
            return Module(
                id = o.getString("id"),
                name = o.optString("name", "모듈"),
                strokes = Stroke.listFromJson(o.getJSONArray("strokes")),
                totalMs = o.getLong("total"),
                speed = o.optDouble("speed", 1.0).toFloat(),
                preDelayMs = o.optLong("pre", 0),
                postDelayMs = o.optLong("post", 0),
                jitterMs = o.optLong("jitter", 0),
                created = o.optLong("created", 0),
            )
        }
    }
}

class ComboItem(var moduleId: String, var repeat: Int)

/** 모듈을 순서대로 이어 붙인 재생 목록. */
class Combo(
    val id: String,
    var name: String,
    var items: MutableList<ComboItem>,
    /** 조합 전체 반복 횟수. 0 이면 무한. */
    var repeat: Int,
    val created: Long = System.currentTimeMillis(),
) {
    fun toJson(): String = JSONObject().apply {
        put("id", id)
        put("name", name)
        put("repeat", repeat)
        put("created", created)
        put("items", JSONArray().apply {
            items.forEach { put(JSONObject().put("m", it.moduleId).put("r", it.repeat)) }
        })
    }.toString()

    companion object {
        fun fromJson(text: String): Combo {
            val o = JSONObject(text)
            val arr = o.getJSONArray("items")
            val items = MutableList(arr.length()) {
                val i = arr.getJSONObject(it)
                ComboItem(i.getString("m"), i.optInt("r", 1))
            }
            return Combo(o.getString("id"), o.optString("name", "조합"), items, o.optInt("repeat", 1), o.optLong("created", 0))
        }
    }
}

fun secs(ms: Long) = "%.1f".format(ms / 1000.0)
