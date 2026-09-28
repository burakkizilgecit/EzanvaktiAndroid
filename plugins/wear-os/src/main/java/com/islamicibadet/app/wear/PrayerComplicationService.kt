package com.islamicibadet.app.wear

import androidx.wear.watchface.complications.data.*
import androidx.wear.watchface.complications.datasource.ComplicationRequest
import androidx.wear.watchface.complications.datasource.SuspendingComplicationDataSourceService

class PrayerComplicationService:SuspendingComplicationDataSourceService(){
  override fun getPreviewData(type:ComplicationType):ComplicationData?=build(type,"Öğle","13:03",0.5f,PrayerRepository.copyFor(java.util.Locale.getDefault().language).nextPrayer)
  override suspend fun onComplicationRequest(request:ComplicationRequest):ComplicationData?{
    val data=PrayerRepository.read(this);val next=data?.next?:return NoDataComplicationData();val previous=data.today.lastOrNull{it.at<=System.currentTimeMillis()}?.at?:System.currentTimeMillis()
    val progress=((System.currentTimeMillis()-previous).toFloat()/(next.at-previous).coerceAtLeast(1)).coerceIn(0f,1f);return build(request.complicationType,next.label,next.time,progress,PrayerRepository.copyFor(data.language).nextPrayer)
  }
  private fun build(type:ComplicationType,name:String,time:String,progress:Float,description:String):ComplicationData=when(type){
    ComplicationType.LONG_TEXT->LongTextComplicationData.Builder(PlainComplicationText.Builder("$name $time").build(),PlainComplicationText.Builder(description).build()).build()
    ComplicationType.RANGED_VALUE->RangedValueComplicationData.Builder(progress,0f,1f,PlainComplicationText.Builder("$name $time").build()).setText(PlainComplicationText.Builder(time).build()).setTitle(PlainComplicationText.Builder(name).build()).build()
    else->ShortTextComplicationData.Builder(PlainComplicationText.Builder(time).build(),PlainComplicationText.Builder(name).build()).build()
  }
}
