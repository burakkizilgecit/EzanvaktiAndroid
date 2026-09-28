package com.islamicibadet.app.wear

import android.content.Context
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class PrayerMoment(val key:String,val label:String,val time:String,val at:Long)
data class Dhikr(val id:String,val name:String,val count:Int,val target:Int)
data class WatchData(val city:String,val language:String,val next:PrayerMoment?,val today:List<PrayerMoment>,val completed:Map<String,Boolean>,val dhikr:List<Dhikr>,val offlineDays:Int,val updated:String)
data class WatchCopy(val appName:String,val today:String,val dhikr:String,val offline:String,val lastSync:String,val nextPrayer:String,val syncPhone:String)

object PrayerRepository {
  private const val PREFS="prayer_watch"; private const val SNAPSHOT="snapshot"
  fun save(context:Context,json:String){ context.getSharedPreferences(PREFS,Context.MODE_PRIVATE).edit().putString(SNAPSHOT,json).apply() }
  fun raw(context:Context)=context.getSharedPreferences(PREFS,Context.MODE_PRIVATE).getString(SNAPSHOT,null)
  fun read(context:Context,now:Long=System.currentTimeMillis()):WatchData?=runCatching{
    val root=JSONObject(raw(context)!!); val days=root.getJSONArray("days"); val date=SimpleDateFormat("yyyy-MM-dd",Locale.US).format(Date(now))
    var today=emptyList<PrayerMoment>(); val all=mutableListOf<PrayerMoment>()
    for(i in 0 until days.length()) { val day=days.getJSONObject(i); val list=day.getJSONArray("entries"); val values=mutableListOf<PrayerMoment>()
      for(j in 0 until list.length()){ val e=list.getJSONObject(j); values += PrayerMoment(e.getString("key"),e.getString("label"),e.getString("time"),e.getLong("at")) }
      all += values; if(day.getString("date")==date) today=values
    }
    val state=root.optJSONObject("watch"); val prayer=state?.optJSONObject("prayer")?.optJSONObject("prayers"); val completed=mutableMapOf<String,Boolean>()
    prayer?.keys()?.forEach { completed[it]=prayer.optBoolean(it) }
    val dhikrJson=state?.optJSONArray("dhikr"); val dhikr=mutableListOf<Dhikr>()
    for(i in 0 until (dhikrJson?.length()?:0)){ val d=dhikrJson!!.getJSONObject(i); dhikr+=Dhikr(d.getString("id"),d.getString("name"),d.optInt("count"),d.optInt("target",1)) }
    WatchData(root.optString("city"),root.optString("language","tr"),all.firstOrNull{it.at>now},today,completed,dhikr,state?.optInt("offlineDaysAvailable")?:0,state?.optString("lastPrayerUpdateAt")?:"")
  }.getOrNull()

  fun togglePrayer(context:Context,date:String,key:String):Boolean{
    val root=runCatching{JSONObject(raw(context)?:return false)}.getOrNull()?:return false
    val prayer=root.optJSONObject("watch")?.optJSONObject("prayer")?:return false
    if(prayer.optString("date")!=date)return false
    val values=prayer.optJSONObject("prayers")?:return false
    values.put(key,!values.optBoolean(key));save(context,root.toString());return true
  }

  fun incrementDhikr(context:Context,id:String):Boolean{
    val root=runCatching{JSONObject(raw(context)?:return false)}.getOrNull()?:return false
    val values=root.optJSONObject("watch")?.optJSONArray("dhikr")?:return false
    for(i in 0 until values.length()){
      val item=values.optJSONObject(i)?:continue
      if(item.optString("id")==id){item.put("count",item.optInt("count")+1);save(context,root.toString());return true}
    }
    return false
  }

  fun copyFor(language:String?):WatchCopy=when(language?.lowercase(Locale.US)?.take(2)){
    "ar"->WatchCopy("مواقيت الصلاة","مواقيت اليوم","الذكر","يومًا دون اتصال","آخر مزامنة","الصلاة القادمة","افتح التطبيق على الهاتف للمزامنة")
    "en"->WatchCopy("Prayer Times","Today's times","Dhikr","offline days","Last sync","Next prayer","Open Prayer Times on your phone to sync")
    else->WatchCopy("Ezan Vakti","Bugünün vakitleri","Zikir","gün çevrimdışı","Son eşitleme","Sıradaki namaz","Vakitleri eşitlemek için telefonda Ezan Vakti’ni açın")
  }
}
