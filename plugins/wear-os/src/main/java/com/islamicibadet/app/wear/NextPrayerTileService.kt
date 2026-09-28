package com.islamicibadet.app.wear

import androidx.wear.protolayout.DimensionBuilders.sp
import androidx.wear.protolayout.LayoutElementBuilders
import androidx.wear.protolayout.TimelineBuilders
import androidx.wear.tiles.RequestBuilders
import androidx.wear.tiles.ResourceBuilders
import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TileService
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

class NextPrayerTileService:TileService(){
  override fun onTileRequest(params:RequestBuilders.TileRequest):ListenableFuture<TileBuilders.Tile>{
    val data=PrayerRepository.read(this);val copy=PrayerRepository.copyFor(data?.language)
    return Futures.immediateFuture(TileBuilders.Tile.Builder().setResourcesVersion("1").setTileTimeline(
    TimelineBuilders.Timeline.Builder().addTimelineEntry(TimelineBuilders.TimelineEntry.Builder().setLayout(
      LayoutElementBuilders.Layout.Builder().setRoot(LayoutElementBuilders.Column.Builder()
        .addContent(label(copy.appName,12f)).addContent(label(data?.next?.label?:copy.syncPhone,22f))
        .addContent(label(data?.next?.time?:"—",18f)).build()).build()).build()).build()).build())
  }
  override fun onTileResourcesRequest(params:RequestBuilders.ResourcesRequest): ListenableFuture<ResourceBuilders.Resources> =
    Futures.immediateFuture(ResourceBuilders.Resources.Builder().setVersion("1").build())
  private fun label(value:String,size:Float)=LayoutElementBuilders.Text.Builder().setText(value).setFontStyle(LayoutElementBuilders.FontStyle.Builder().setSize(sp(size)).build()).setMaxLines(2).build()
}
