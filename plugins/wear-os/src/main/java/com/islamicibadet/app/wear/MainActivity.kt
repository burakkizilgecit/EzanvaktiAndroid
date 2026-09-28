package com.islamicibadet.app.wear

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.widget.*
import com.google.android.gms.wearable.Wearable
import org.json.JSONObject

class MainActivity:Activity(){
  private val gold=Color.rgb(231,179,78)
  private val handler=Handler(Looper.getMainLooper())
  private var countdownView:TextView?=null
  private var nextAt:Long?=null
  private val ticker=object:Runnable{override fun run(){
    val at=nextAt
    if(at!=null&&at<=System.currentTimeMillis()){render()} else if(at!=null){countdownView?.text=remaining(at)}
    handler.postDelayed(this,1000)
  }}
  override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);render()}
  override fun onResume(){super.onResume();render();handler.removeCallbacks(ticker);handler.post(ticker)}
  override fun onPause(){handler.removeCallbacks(ticker);super.onPause()}
  private fun text(value:String,size:Float,color:Int=Color.WHITE)=TextView(this).apply{text=value;textSize=size;setTextColor(color);gravity=Gravity.CENTER;setPadding(6,4,6,4)}
  private fun render(){
    val data=PrayerRepository.read(this);val copy=PrayerRepository.copyFor(data?.language);val root=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;gravity=Gravity.CENTER_HORIZONTAL;setPadding(18,18,18,24);setBackgroundColor(Color.rgb(5,11,19))}
    root.addView(text(data?.city?.takeIf{it.isNotBlank()}?:copy.appName,12f,Color.LTGRAY))
    if(data?.next==null){nextAt=null;countdownView=null;root.addView(text(copy.syncPhone,14f))} else {
      nextAt=data.next.at
      root.addView(text(data.next.label,23f,gold));root.addView(text(data.next.time,20f));countdownView=text(remaining(data.next.at),20f,gold).also{root.addView(it)}
      root.addView(text(copy.today,13f,Color.LTGRAY)); data.today.forEach { p ->
        val row=Button(this).apply{text="${if(data.completed[p.key]==true) "✓" else "○"}  ${p.label}  ${p.time}";isEnabled=p.key!="sunrise";setOnClickListener{val date=java.text.SimpleDateFormat("yyyy-MM-dd",java.util.Locale.US).format(java.util.Date());val action=JSONObject(mapOf("type" to "togglePrayer","date" to date,"prayer" to p.key)).toString();PrayerRepository.togglePrayer(this@MainActivity,date,p.key);send(action);render()}}
        root.addView(row,LinearLayout.LayoutParams(-1,-2))
      }
      if(data.dhikr.isNotEmpty()){root.addView(text(copy.dhikr,14f,gold));data.dhikr.take(5).forEach { d -> root.addView(Button(this).apply{text="${d.name}  ${d.count}/${d.target}";setOnClickListener{val action=JSONObject(mapOf("type" to "incrementDhikr","id" to d.id)).toString();PrayerRepository.incrementDhikr(this@MainActivity,d.id);send(action);render()}},LinearLayout.LayoutParams(-1,-2))}}
      root.addView(text("${data.offlineDays} ${copy.offline} • ${copy.lastSync}: ${data.updated.ifBlank{"—"}}",9f,Color.GRAY))
    }
    setContentView(ScrollView(this).apply{addView(root)})
  }
  private fun remaining(at:Long):String{val s=((at-System.currentTimeMillis()).coerceAtLeast(0))/1000;return "%02d:%02d:%02d".format(s/3600,(s%3600)/60,s%60)}
  private fun send(json:String){Wearable.getNodeClient(this).connectedNodes.addOnSuccessListener{nodes->nodes.forEach{Wearable.getMessageClient(this).sendMessage(it.id,"/prayer/action",json.toByteArray())}}}
}
