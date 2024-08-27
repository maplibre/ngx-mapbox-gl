import {
  Component,
  OnChanges,
  SimpleChanges,
  viewChild,
  input,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  MatPaginator,
  PageEvent,
  MatPaginatorModule,
} from "@angular/material/paginator";
import {
  MapComponent,
  GeoJSONSourceComponent,
  PopupComponent,
  MarkersForClustersComponent,
  PointDirective,
  ClusterPointDirective,
} from "@maplibre/ngx-maplibre-gl";
import { MatListModule } from "@angular/material/list";

import earthquakesData from "./earthquakes.geo.json";

@Component({
  selector: "showcase-cluster-popup",
  template: `
    <mat-list>
      @for (leaf of leaves(); track leaf) {
      <mat-list-item>
        {{ leaf.properties?.['Primary ID'] }}
      </mat-list-item>
      }
    </mat-list>
    <mat-paginator
      [length]="selectedCluster().properties?.point_count"
      [pageSize]="5"
      (page)="changePage($event)"
    ></mat-paginator>
  `,
  standalone: true,
  imports: [MatListModule, MatPaginatorModule],
})
export class ClusterPopupComponent implements OnChanges {
  readonly selectedCluster = input.required<{
    geometry: GeoJSON.Point;
    properties: any;
  }>();

  readonly clusterComponent = input.required<GeoJSONSourceComponent>();

  readonly paginator = viewChild.required(MatPaginator);

  readonly leaves = signal<GeoJSON.Feature<GeoJSON.Geometry>[]>([]);

  ngOnChanges(changes: SimpleChanges) {
    this.changePage();
    if (changes.selectedCluster && !changes.selectedCluster.isFirstChange()) {
      this.paginator().firstPage();
    }
  }

  async changePage(pageEvent?: PageEvent) {
    let offset = 0;
    if (pageEvent) {
      offset = pageEvent.pageIndex * 5;
    }

    const leaves = await this.clusterComponent().getClusterLeaves(
      this.selectedCluster().properties.cluster_id,
      5,
      offset
    );

    this.leaves.set(leaves);
  }
}

/**
 * Remember: mgl-layer are way faster than html markers
 * Html markers are fine if you don't have lots of points
 * Try to draw your point with a mgl-layer before using html markers
 * For a compromise, look at cluster-html example, which use only html markers for cluster points
 */

@Component({
  selector: "showcase-demo",
  template: `
    <mgl-map
      [style]="
        'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL'
      "
      [zoom]="[3]"
      [center]="[-103.59179687498357, 40.66995747013945]"
      [preserveDrawingBuffer]="true"
    >
      <mgl-geojson-source
        #clusterComponent
        id="earthquakes"
        [data]="earthquakes()"
        [cluster]="true"
        [clusterRadius]="50"
        [clusterMaxZoom]="14"
      ></mgl-geojson-source>
      <mgl-markers-for-clusters source="earthquakes">
        <ng-template mglPoint let-feature>
          <div class="marker" [title]="feature.properties['Secondary ID']">
            {{ feature.properties["Primary ID"] }}
          </div>
        </ng-template>
        <ng-template mglClusterPoint let-feature>
          <div class="marker-cluster" (click)="selectCluster($event, feature)">
            {{ feature.properties?.point_count }}
          </div>
        </ng-template>
      </mgl-markers-for-clusters>
      @if (selectedCluster(); as selectedClusterValue) {
      <mgl-popup [feature]="selectedClusterValue">
        <showcase-cluster-popup
          [clusterComponent]="clusterComponent"
          [selectedCluster]="selectedClusterValue"
        ></showcase-cluster-popup>
      </mgl-popup>
      }
    </mgl-map>
  `,
  styleUrls: ["./examples.css", "./ngx-cluster-html.component.css"],
  standalone: true,
  imports: [
    MapComponent,
    GeoJSONSourceComponent,
    MarkersForClustersComponent,
    PointDirective,
    ClusterPointDirective,
    PopupComponent,
    ClusterPopupComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxClusterHtmlComponent {
  readonly earthquakes = signal<GeoJSON.FeatureCollection>(
    this.getEarthquakes()
  );

  readonly selectedCluster = signal<{
    geometry: GeoJSON.Point;
    properties: any;
  } | null>(null);

  getEarthquakes() {
    const earthquakes = earthquakesData as GeoJSON.FeatureCollection;
    if (earthquakes.features.length) {
      earthquakes.features.pop();
    }
    return earthquakes;
  }

  selectCluster(event: MouseEvent, feature: any) {
    event.stopPropagation(); // This is needed, otherwise the popup will close immediately
    // Change the ref, to trigger mgl-popup onChanges (when the user click on the same cluster)
    this.selectedCluster.set({
      geometry: feature.geometry,
      properties: feature.properties,
    });
  }
}
