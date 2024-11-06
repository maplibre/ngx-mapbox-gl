import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { LngLat, MapLayerMouseEvent } from "maplibre-gl";
import { GeoJsonProperties } from "geojson";
import {
  MapComponent,
  PopupComponent,
  LayerComponent,
} from "@maplibre/ngx-maplibre-gl";

@Component({
  selector: "showcase-demo",
  template: `
    <mgl-map
      [style]="
        'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL'
      "
      [zoom]="[3]"
      [center]="[-100.04, 38.907]"
      [cursorStyle]="cursorStyle"
      (mapClick)="onMapClick()"
      [preserveDrawingBuffer]="true"
    >
      <mgl-layer
        id="states-layer"
        type="fill"
        [source]="{
          type: 'geojson',
          data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces_shp.geojson'
        }"
        [paint]="{
          'fill-color': 'rgba(200, 100, 240, 0.4)',
          'fill-outline-color': 'rgba(200, 100, 240, 1)'
        }"
        (layerMouseEnter)="cursorStyle.set('pointer')"
        (layerMouseLeave)="cursorStyle.set('')"
        (layerClick)="onClick($event)"
        (click)="$event.stopPropagation()"
      />

      @if (selectedLngLat(); as selectedLngLatValue) {
      <mgl-popup [lngLat]="selectedLngLatValue" [closeOnClick]="false">
        @if(selectedElement(); as selectedElementValue){
        <span [innerHTML]="selectedElementValue?.name"></span>
        }
      </mgl-popup>
      }
    </mgl-map>
  `,
  styleUrls: ["./examples.css"],
  standalone: true,
  imports: [MapComponent, LayerComponent, PopupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolygonPopupOnClickComponent {
  readonly selectedElement = signal<GeoJsonProperties | null>(null);
  readonly selectedLngLat = signal<LngLat | null>(null);
  readonly cursorStyle = signal("");

  onClick(evt: MapLayerMouseEvent) {
    this.selectedLngLat.set(evt.lngLat);
    this.selectedElement.set(evt.features![0].properties);
  }

  onMapClick() {
    this.selectedElement.set(null);
  }
}
