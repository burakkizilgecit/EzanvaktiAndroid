const {
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
} = require("@expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

const android = 'xmlns:android="http://schemas.android.com/apk/res/android"';
const text = (id, size, extra = "") =>
  `<TextView android:id="@+id/${id}" android:layout_width="wrap_content" android:layout_height="wrap_content" android:textSize="${size}sp" android:fontFamily="sans" ${extra}/>`;
const root = (content) =>
  `<FrameLayout ${android} android:id="@+id/widget_root" android:layout_width="match_parent" android:layout_height="match_parent" android:background="@drawable/prayer_widget_light" android:clipToOutline="true"><ImageView android:id="@+id/widget_hero" android:layout_width="match_parent" android:layout_height="match_parent" android:scaleType="centerCrop" android:importantForAccessibility="no"/><LinearLayout android:id="@+id/widget_content" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical" android:padding="12dp">${content}</LinearLayout></FrameLayout>`;
const empty = text(
  "widget_empty",
  14,
  'android:layout_marginTop="8dp" android:text="@string/prayer_widget_refresh"',
);
const resources = {
  "layout/prayer_widget_next.xml": root(
    `${text("widget_city", 13, 'android:maxLines="1" android:ellipsize="end" android:textStyle="bold"')}${empty}<LinearLayout android:id="@+id/widget_details" android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal" android:gravity="center_vertical">${text("widget_symbol", 42, 'android:layout_marginEnd="10dp"')}<LinearLayout android:layout_width="0dp" android:layout_weight="1" android:layout_height="wrap_content" android:orientation="vertical">${text("widget_heading", 10, 'android:maxLines="1"')}${text("widget_prayer", 21, 'android:textStyle="bold" android:maxLines="1" android:ellipsize="end"')}<Chronometer android:id="@+id/widget_countdown" android:layout_width="match_parent" android:layout_height="wrap_content" android:textSize="28sp" android:textStyle="bold" android:fontFamily="sans-serif-medium" android:textDirection="ltr" android:format="%s" android:countDown="true"/>${text("widget_time", 14, 'android:textDirection="ltr"')}</LinearLayout></LinearLayout>`,
  ),
  "layout/prayer_widget_times.xml": root(
    `<LinearLayout android:layout_width="match_parent" android:layout_height="wrap_content" android:orientation="horizontal" android:gravity="center_vertical">${text("widget_city", 17, 'android:layout_weight="1" android:maxLines="1" android:ellipsize="end" android:textStyle="bold"')}<LinearLayout android:layout_width="wrap_content" android:layout_height="wrap_content" android:orientation="vertical" android:gravity="end">${text("widget_date", 13)}${text("widget_day", 12)}</LinearLayout></LinearLayout>${empty}<LinearLayout android:id="@+id/widget_columns" android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight="1" android:layout_marginTop="4dp" android:orientation="horizontal" android:gravity="center_vertical"/>`,
  ),
  "layout/prayer_widget_cell.xml": `<LinearLayout ${android} android:id="@+id/cell_root" android:layout_width="0dp" android:layout_weight="1" android:layout_height="match_parent" android:gravity="center" android:orientation="vertical" android:paddingVertical="2dp">${text("cell_icon", 27)}${text("cell_label", 13, 'android:maxLines="1" android:autoSizeTextType="uniform" android:autoSizeMinTextSize="10sp" android:autoSizeMaxTextSize="13sp" android:layout_marginTop="2dp"')}${text("cell_time", 15, 'android:textDirection="ltr" android:textStyle="bold" android:layout_marginTop="2dp"')}${text("cell_status", 11, 'android:maxLines="1" android:layout_marginTop="2dp"')}</LinearLayout>`,
};
for (const [name, color, border] of [
  ["light", "#FFFDF8", "#E7DFD2"],
  ["dark", "#111C2C", "#304158"],
  ["active_light", "#FAF1DE", "#F0DEB8"],
  ["active_dark", "#302C22", "#655333"],
])
  resources[`drawable/prayer_widget_${name}.xml`] =
    `<shape ${android}><solid android:color="${color}"/><corners android:radius="22dp"/><stroke android:width="1dp" android:color="${border}"/></shape>`;
// "next" = compact next-prayer widget: wide and short (2x1).
// "times" = full prayer-list widget: wide and short (5x1) so all entries sit side by side in one row.
const WIDGET_SIZES = {
  next: { minWidth: 150, minHeight: 45, minResizeWidth: 140, minResizeHeight: 40, targetCellWidth: 2, targetCellHeight: 1 },
  times: { minWidth: 360, minHeight: 88, minResizeWidth: 340, minResizeHeight: 75, targetCellWidth: 5, targetCellHeight: 1 },
};
for (const small of [false, true]) {
  const key = small ? "next" : "times";
  const sz = WIDGET_SIZES[key];
  resources[`xml/prayer_${key}_info.xml`] =
    `<appwidget-provider ${android} android:minWidth="${sz.minWidth}dp" android:minHeight="${sz.minHeight}dp" android:minResizeWidth="${sz.minResizeWidth}dp" android:minResizeHeight="${sz.minResizeHeight}dp" android:targetCellWidth="${sz.targetCellWidth}" android:targetCellHeight="${sz.targetCellHeight}" android:resizeMode="horizontal|vertical" android:updatePeriodMillis="1800000" android:widgetCategory="home_screen" android:initialLayout="@layout/prayer_widget_${key}" android:previewLayout="@layout/prayer_widget_${key}" android:description="@string/prayer_widget_${key}"/>`;
}
const locales = {
  values: [
    "Next prayer",
    "Today’s prayer times",
    "Location information is unavailable.",
    "Open the app to refresh",
  ],
  "values-tr": [
    "Sıradaki namaz",
    "Günün namaz vakitleri",
    "Konum bilgisi bulunamamaktadır.",
    "Güncellemek için uygulamayı açın",
  ],
  "values-ar": [
    "الصلاة القادمة",
    "مواقيت اليوم",
    "معلومات الموقع غير متوفرة.",
    "افتح التطبيق للتحديث",
  ],
};
for (const [folder, labels] of Object.entries(locales))
  resources[`${folder}/prayer_widgets.xml`] =
    `<resources>${["next", "times", "missing", "refresh"].map((key, i) => `<string name="prayer_widget_${key}">${labels[i]}</string>`).join("")}</resources>`;
function writeResources(projectRoot) {
  const main = path.join(projectRoot, "android/app/src/main");
  for (const [file, value] of Object.entries(resources)) {
    const dest = path.join(main, "res", file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, value);
  }
  const java = path.join(main, "java/com/islamicibadet/app/widget");
  fs.mkdirSync(java, { recursive: true });
  for (const name of ["PrayerWidgets.kt", "PrayerWidget.java"])
    fs.copyFileSync(
      path.join(__dirname, "prayer-widgets", name),
      path.join(java, name),
    );
  for (const name of ["light", "dark"])
    fs.copyFileSync(
      path.join(projectRoot, "assets/prayer", "hero-" + name + ".webp"),
      path.join(main, "res/drawable", "prayer_hero_" + name + ".webp"),
    );
}
function patchManifest(manifest) {
  const app = manifest.application[0];
  app.receiver = (app.receiver || []).filter(
    (r) =>
      ![".widget.PrayerWidget", ".widget.NextPrayerWidget"].includes(
        r.$["android:name"],
      ),
  );
  for (const small of [false, true])
    app.receiver.push({
      $: {
        "android:name": small
          ? ".widget.NextPrayerWidget"
          : ".widget.PrayerWidget",
        "android:exported": "false",
        "android:label": `@string/prayer_widget_${small ? "next" : "times"}`,
      },
      "intent-filter": [
        {
          action: [
            "android.appwidget.action.APPWIDGET_UPDATE",
            ...(!small
              ? [
                  "android.intent.action.BOOT_COMPLETED",
                  "android.intent.action.TIME_SET",
                  "android.intent.action.TIMEZONE_CHANGED",
                  "android.intent.action.LOCALE_CHANGED",
                  "android.intent.action.MY_PACKAGE_REPLACED",
                ]
              : []),
          ].map((name) => ({ $: { "android:name": name } })),
        },
      ],
      "meta-data": [
        {
          $: {
            "android:name": "android.appwidget.provider",
            "android:resource": `@xml/prayer_${small ? "next" : "times"}_info`,
          },
        },
      ],
    });
}
function patchApplication(content) {
  if (
    !content.includes(
      "add(com.islamicibadet.app.widget.PrayerWidgetsPackage())",
    )
  )
    content = content.replace(
      "PackageList(this).packages.apply {",
      "PackageList(this).packages.apply {\n              add(com.islamicibadet.app.widget.PrayerWidgetsPackage())",
    );
  if (!content.includes("NativePrayerWidgets.updateAll(this)"))
    content = content.replace(
      "super.onConfigurationChanged(newConfig)",
      "super.onConfigurationChanged(newConfig)\n    com.islamicibadet.app.widget.NativePrayerWidgets.updateAll(this)",
    );
  return content;
}
module.exports = function withPrayerWidgets(config) {
  config = withAndroidManifest(config, (c) => {
    patchManifest(c.modResults.manifest);
    return c;
  });
  config = withMainApplication(config, (c) => {
    c.modResults.contents = patchApplication(c.modResults.contents);
    return c;
  });
  return withDangerousMod(config, [
    "android",
    async (c) => {
      writeResources(c.modRequest.projectRoot);
      return c;
    },
  ]);
};
module.exports.writeResources = writeResources;
module.exports.patchManifest = patchManifest;
module.exports.patchApplication = patchApplication;
