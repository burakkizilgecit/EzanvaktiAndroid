package com.islamicibadet.app.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.appwidget.AppWidgetProviderInfo
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.util.TypedValue
import android.view.View
import android.widget.RemoteViews
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import com.islamicibadet.app.R
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import com.google.android.gms.wearable.WearableListenerService
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

class PrayerWidgetsPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(PrayerWidgetsModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
class PrayerWidgetsModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "PrayerWidgets"
  @ReactMethod fun addListener(eventName: String) {}
  @ReactMethod fun removeListeners(count: Int) {}
  @ReactMethod fun consumeActions(promise: Promise) {
    val prefs = context.getSharedPreferences("prayer_widgets", Context.MODE_PRIVATE)
    val queued = prefs.getString("watch_actions", "[]") ?: "[]"
    prefs.edit().putString("watch_actions", "[]").apply()
    promise.resolve(queued)
  }
  @ReactMethod fun publish(json: String, promise: Promise) {
    try {
      val value = JSONObject(json)
      require(value.getInt("version") == 1)
      require(value.getJSONArray("days").length() <= 32)
      context.getSharedPreferences("prayer_widgets", Context.MODE_PRIVATE).edit().putString("snapshot", json).apply()
      NativePrayerWidgets.updateAll(context)
      val request = PutDataMapRequest.create("/prayer/snapshot").apply {
        dataMap.putString("json", json)
        dataMap.putLong("publishedAt", System.currentTimeMillis())
      }.asPutDataRequest().setUrgent()
      Wearable.getDataClient(context).putDataItem(request)
        .addOnSuccessListener { promise.resolve(null) }
        .addOnFailureListener { promise.resolve(null) }
    } catch (e: Exception) { promise.reject("WIDGET_PUBLISH", e) }
  }
}
class WearActionService : WearableListenerService() {
  override fun onMessageReceived(event: MessageEvent) {
    if (event.path != "/prayer/action") return
    val action = String(event.data, Charsets.UTF_8)
    runCatching {
      JSONObject(action)
      val prefs = getSharedPreferences("prayer_widgets", Context.MODE_PRIVATE)
      val queue = try { JSONArray(prefs.getString("watch_actions", "[]")) } catch (_: Exception) { JSONArray() }
      queue.put(action)
      while (queue.length() > 100) queue.remove(0)
      prefs.edit().putString("watch_actions", queue.toString()).apply()
    }
  }
}
open class PrayerWidgetBase : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) { NativePrayerWidgets.updateAll(context) }
  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: Bundle) { NativePrayerWidgets.updateAll(context) }
  override fun onDisabled(context: Context) { NativePrayerWidgets.updateAll(context) }
  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context,intent)
    if (intent.action in listOf("com.islamicibadet.app.WIDGET_BOUNDARY",Intent.ACTION_BOOT_COMPLETED,Intent.ACTION_TIME_CHANGED,Intent.ACTION_TIMEZONE_CHANGED,Intent.ACTION_LOCALE_CHANGED,Intent.ACTION_MY_PACKAGE_REPLACED)) NativePrayerWidgets.updateAll(context)
  }
}
class NextPrayerWidget : PrayerWidgetBase()

object NativePrayerWidgets {
  private fun alarmIntent(context: Context) = PendingIntent.getBroadcast(context, 4201,
    Intent(context, PrayerWidget::class.java).setAction("com.islamicibadet.app.WIDGET_BOUNDARY"), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  private fun snapshot(context: Context): JSONObject? = try { JSONObject(context.getSharedPreferences("prayer_widgets", Context.MODE_PRIVATE).getString("snapshot", "") ?: "") } catch (_: Exception) { null }
  private fun dateKey(ms: Long) = SimpleDateFormat("yyyy-MM-dd",Locale.US).format(Date(ms))
  private fun label(s: JSONObject?,key: String,context: Context): String = s?.optJSONObject("labels")?.optString(key)?.takeIf { it.isNotEmpty() } ?: context.getString(when(key) { "missing" -> R.string.prayer_widget_missing; "next" -> R.string.prayer_widget_next; else -> R.string.prayer_widget_refresh })
  fun updateAll(context: Context) {
    val manager=AppWidgetManager.getInstance(context)
    val regular=manager.getAppWidgetIds(ComponentName(context,PrayerWidget::class.java))
    val small=manager.getAppWidgetIds(ComponentName(context,NextPrayerWidget::class.java))
    val alarm=context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pending=alarmIntent(context)
    if(regular.isEmpty()&&small.isEmpty()) { alarm.cancel(pending); return }
    val data=snapshot(context)
    val now=System.currentTimeMillis()
    val days=data?.optJSONArray("days")
    val allDays=(0 until (days?.length() ?: 0)).mapNotNull {days?.optJSONObject(it)}
    // Different time-zone rules invalidate the precomputed calendar; never show stale clock times.
    val zoneValid=data?.optString("timeZone")==TimeZone.getDefault().id
    val today=if(zoneValid) allDays.firstOrNull {it.optString("date")==dateKey(now)} else null
    val entries=allDays.flatMap { day -> val list=day.optJSONArray("entries"); (0 until (list?.length() ?: 0)).mapNotNull{list?.optJSONObject(it)} }
    val next=if(today!=null) entries.firstOrNull {it.optLong("at")>now} else null
    val isDark=when(data?.optString("theme")) { "light" -> false; "dark" -> true; else -> context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES }
    regular.forEach { render(context,manager,it,false,data,today,next,isDark,now) }
    small.forEach { render(context,manager,it,true,data,today,next,isDark,now) }
    alarm.cancel(pending)
    if(next!=null) {
      val midnight=Calendar.getInstance().apply {timeInMillis=now;add(Calendar.DAY_OF_YEAR,1);set(Calendar.HOUR_OF_DAY,0);set(Calendar.MINUTE,0);set(Calendar.SECOND,0);set(Calendar.MILLISECOND,0)}.timeInMillis
      val at=minOf(next.getLong("at")+100,midnight+100)
      try {
        if(Build.VERSION.SDK_INT<31||alarm.canScheduleExactAlarms()) alarm.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pending)
        else alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pending)
      } catch (_: SecurityException) {
        // Permission can change between checking it and scheduling the boundary.
        alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pending)
      }
    }
  }
  private fun render(context: Context,manager:AppWidgetManager,id:Int,small:Boolean,s:JSONObject?,today:JSONObject?,next:JSONObject?,dark:Boolean,now:Long) {
    val views=RemoteViews(context.packageName,if(small) R.layout.prayer_widget_next else R.layout.prayer_widget_times)
    val options=manager.getAppWidgetOptions(id)
    val onKeyguard=options.getInt(AppWidgetManager.OPTION_APPWIDGET_HOST_CATEGORY,AppWidgetProviderInfo.WIDGET_CATEGORY_HOME_SCREEN)==AppWidgetProviderInfo.WIDGET_CATEGORY_KEYGUARD
    val primary=Color.parseColor(if(dark) "#F8FAFC" else "#1F2937")
    val muted=Color.parseColor(if(dark) "#AAB8CD" else "#6B6257")
    val gold=Color.parseColor(if(dark) "#E7B34E" else "#94630C")
    val orange=Color.parseColor(if(dark) "#FF9F0A" else "#C85A00")
    val green=Color.parseColor(if(dark) "#34C759" else "#2A7A3C")
    val rtl=s?.optString("language")=="ar"
    views.setInt(R.id.widget_root,"setBackgroundResource",if(dark) R.drawable.prayer_widget_dark else R.drawable.prayer_widget_light)
    views.setInt(R.id.widget_content,"setLayoutDirection",if(rtl) View.LAYOUT_DIRECTION_RTL else View.LAYOUT_DIRECTION_LTR)
    views.setImageViewResource(R.id.widget_hero,if(dark)R.drawable.prayer_hero_dark else R.drawable.prayer_hero_light)
    views.setInt(R.id.widget_hero,"setImageAlpha",if(dark)45 else 28)
    val intent=Intent(Intent.ACTION_VIEW,Uri.parse("islamicibadet://prayer-times"),context,com.islamicibadet.app.MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    val click=PendingIntent.getActivity(context,id,intent,PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    views.setOnClickPendingIntent(R.id.widget_root,click)
    views.setTextColor(R.id.widget_city,primary)
    views.setTextViewText(R.id.widget_city,s?.optString("city") ?: "")
    val available=today!=null&&next!=null
    views.setViewVisibility(R.id.widget_empty,if(available)View.GONE else View.VISIBLE)
    views.setTextColor(R.id.widget_empty,primary)
    views.setTextViewText(R.id.widget_empty,if(s?.optString("city").isNullOrEmpty())label(s,"missing",context) else label(s,"refresh",context))
    views.setContentDescription(R.id.widget_root,if(available) "${s?.optString("city")}, ${label(s,"next",context)}: ${next?.optString("label")} ${next?.optString("time")}" else label(s,"refresh",context))
    if(small) {
      views.setViewVisibility(R.id.widget_details,if(available)View.VISIBLE else View.GONE)
      val compact=options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH,180)<220
      val short=options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT,100)<130
      views.setViewVisibility(R.id.widget_city,if(onKeyguard||compact||short)View.GONE else View.VISIBLE)
      views.setTextViewText(R.id.widget_heading,label(s,"next",context));views.setTextColor(R.id.widget_heading,muted)
      views.setTextViewText(R.id.widget_prayer,next?.optString("label") ?: "");views.setTextColor(R.id.widget_prayer,primary)
      views.setTextViewText(R.id.widget_time,next?.optString("time") ?: "");views.setTextColor(R.id.widget_time,muted)
      views.setTextViewText(R.id.widget_symbol,next?.optString("icon") ?: "☀");views.setTextColor(R.id.widget_symbol,gold)
      views.setViewVisibility(R.id.widget_symbol,if(onKeyguard||compact)View.GONE else View.VISIBLE)
      views.setTextColor(R.id.widget_countdown,gold)
      views.setTextViewTextSize(R.id.widget_countdown,TypedValue.COMPLEX_UNIT_SP,if(compact)24f else 28f)
      views.setChronometerCountDown(R.id.widget_countdown,true)
      views.setChronometer(R.id.widget_countdown,SystemClock.elapsedRealtime()+maxOf(0,(next?.optLong("at")?:now)-now),null,available)
    } else {
      views.setTextViewText(R.id.widget_date,today?.optString("dateLabel") ?: "");views.setTextColor(R.id.widget_date,primary)
      views.setTextViewText(R.id.widget_day,today?.optString("dayLabel") ?: "");views.setTextColor(R.id.widget_day,muted)
      views.setViewVisibility(R.id.widget_columns,if(available)View.VISIBLE else View.GONE)
      views.removeAllViews(R.id.widget_columns)
      val source=today?.optJSONArray("entries")
      val list=(0 until (source?.length() ?: 0)).mapNotNull { source?.optJSONObject(it) }.filter { !onKeyguard || it.optString("key")!="sunrise" }
      for(entry in list) {
        val active=entry.optLong("at")==next?.optLong("at")
        val past=entry.optLong("at")<=now
        val color=if(active)gold else if(past)orange else green
        val cell=RemoteViews(context.packageName,R.layout.prayer_widget_cell)
        cell.setInt(R.id.cell_root,"setBackgroundResource",if(active) {if(dark)R.drawable.prayer_widget_active_dark else R.drawable.prayer_widget_active_light} else android.R.color.transparent)
        cell.setTextViewText(R.id.cell_icon,entry.optString("icon"));cell.setTextViewText(R.id.cell_label,entry.optString("label"));cell.setTextViewText(R.id.cell_time,entry.optString("time"))
        cell.setTextViewText(R.id.cell_status,if(active)label(s,"upcoming",context) else if(past) "·" else "—")
        for(viewId in listOf(R.id.cell_icon,R.id.cell_label,R.id.cell_time,R.id.cell_status))cell.setTextColor(viewId,color)
        cell.setContentDescription(R.id.cell_root,"${entry.optString("label")} ${entry.optString("time")}${if(active) ", ${label(s,"upcoming",context)}" else ""}")
        views.addView(R.id.widget_columns,cell)
      }
    }
    manager.updateAppWidget(id,views)
  }
}
