package com.islamicibadet.app.wear

import android.content.ComponentName
import android.net.Uri
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.WearableListenerService
import androidx.wear.tiles.TileService
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester

class PrayerDataService: WearableListenerService(){
  override fun onDataChanged(events:DataEventBuffer){
    events.filter{it.type==DataEvent.TYPE_CHANGED&&it.dataItem.uri.path=="/prayer/snapshot"}.forEach{
      DataMapItem.fromDataItem(it.dataItem).dataMap.getString("json")?.let { json ->
        PrayerRepository.save(this,json)
        TileService.getUpdater(this).requestUpdate(NextPrayerTileService::class.java)
        ComplicationDataSourceUpdateRequester.create(
          this,
          ComponentName(this, PrayerComplicationService::class.java),
        ).requestUpdateAll()
      }
    }
  }
}
