package net.justies.autoclicker

import android.content.Context
import org.json.JSONObject
import java.io.File
import java.util.UUID

/** 모듈은 files/modules/<id>.json, 조합은 files/combos/<id>.json 한 파일씩. */
object Store {
    private fun dir(ctx: Context, name: String) = File(ctx.filesDir, name).apply { mkdirs() }
    private fun prefs(ctx: Context) = ctx.getSharedPreferences("settings", Context.MODE_PRIVATE)

    fun newId(): String = UUID.randomUUID().toString().replace("-", "").take(12)

    // ── 모듈 ──

    fun modules(ctx: Context): List<Module> {
        migrate(ctx)
        return dir(ctx, "modules").listFiles().orEmpty()
            .mapNotNull { f -> runCatching { Module.fromJson(f.readText()) }.getOrNull() }
            .sortedBy { it.created }
    }

    fun module(ctx: Context, id: String): Module? =
        File(dir(ctx, "modules"), "$id.json").takeIf { it.exists() }
            ?.let { f -> runCatching { Module.fromJson(f.readText()) }.getOrNull() }

    fun saveModule(ctx: Context, m: Module) = File(dir(ctx, "modules"), "${m.id}.json").writeText(m.toJson())

    fun deleteModule(ctx: Context, id: String) {
        File(dir(ctx, "modules"), "$id.json").delete()
        if (selected(ctx) == "m:$id") select(ctx, null)
    }

    // ── 조합 ──

    fun combos(ctx: Context): List<Combo> =
        dir(ctx, "combos").listFiles().orEmpty()
            .mapNotNull { f -> runCatching { Combo.fromJson(f.readText()) }.getOrNull() }
            .sortedBy { it.created }

    fun combo(ctx: Context, id: String): Combo? =
        File(dir(ctx, "combos"), "$id.json").takeIf { it.exists() }
            ?.let { f -> runCatching { Combo.fromJson(f.readText()) }.getOrNull() }

    fun saveCombo(ctx: Context, c: Combo) = File(dir(ctx, "combos"), "${c.id}.json").writeText(c.toJson())

    fun deleteCombo(ctx: Context, id: String) {
        File(dir(ctx, "combos"), "$id.json").delete()
        if (selected(ctx) == "c:$id") select(ctx, null)
    }

    // ── 선택 (패널의 ▶ 가 재생할 대상): "m:<id>" 또는 "c:<id>" ──

    fun selected(ctx: Context): String? = prefs(ctx).getString("selected", null)

    fun select(ctx: Context, key: String?) = prefs(ctx).edit().putString("selected", key).apply()

    fun selectedName(ctx: Context): String? {
        val key = selected(ctx) ?: return null
        val id = key.substring(2)
        return when {
            key.startsWith("m:") -> module(ctx, id)?.name
            key.startsWith("c:") -> combo(ctx, id)?.let { "[조합] ${it.name}" }
            else -> null
        }
    }

    /** 모듈 하나를 단독 재생할 때 반복 횟수. 0 이면 무한. */
    fun repeat(ctx: Context): Int = prefs(ctx).getInt("repeat", 0)

    fun setRepeat(ctx: Context, n: Int) = prefs(ctx).edit().putInt("repeat", n).apply()

    /** 0.1 버전의 recording.json 하나를 첫 모듈로 옮긴다. */
    private fun migrate(ctx: Context) {
        val old = File(ctx.filesDir, "recording.json")
        if (!old.exists()) return
        runCatching {
            val o = JSONObject(old.readText())
            val strokes = Stroke.listFromJson(o.getJSONArray("strokes"))
            if (strokes.isNotEmpty()) {
                val m = Module(newId(), "녹화 1", strokes, o.getLong("total"))
                saveModule(ctx, m)
                if (selected(ctx) == null) select(ctx, "m:${m.id}")
            }
        }
        old.delete()
    }
}
