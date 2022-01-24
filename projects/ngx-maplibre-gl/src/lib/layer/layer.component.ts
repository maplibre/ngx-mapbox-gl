import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  LayerSpecification,
  FilterSpecification,
  MapLayerMouseEvent,
  MapLayerTouchEvent,
} from 'maplibre-gl';
import { fromEvent, Subscription } from 'rxjs';
import { filter, mapTo, startWith, switchMap } from 'rxjs/operators';
import { MapService, SetupLayer } from '../map/map.service';
import { EventData, LayerEvents } from '../map/map.types';

@Component({
  selector: 'mgl-layer',
  template: '',
})
export class LayerComponent
  implements OnInit, OnDestroy, OnChanges, LayerEvents {
  /* Init inputs */
  @Input() id: LayerSpecification['id'];
  @Input() source?: string;
  @Input() type: LayerSpecification['type'];
  @Input() metadata?: LayerSpecification['metadata'];
  @Input() sourceLayer?: string;

  /* Dynamic inputs */
  @Input() filter?: FilterSpecification;
  @Input() layout?: LayerSpecification['layout'];
  @Input() paint?: LayerSpecification['paint'];
  @Input() before?: string;
  @Input() minzoom?: LayerSpecification['minzoom'];
  @Input() maxzoom?: LayerSpecification['maxzoom'];

  @Output() layerClick = new EventEmitter<MapLayerMouseEvent & EventData>();
  @Output() layerDblClick = new EventEmitter<MapLayerMouseEvent & EventData>();
  @Output() layerMouseDown = new EventEmitter<MapLayerMouseEvent & EventData>();
  @Output() layerMouseUp = new EventEmitter<MapLayerMouseEvent & EventData>();
  @Output() layerMouseEnter = new EventEmitter<
    MapLayerMouseEvent & EventData
  >();
  @Output() layerMouseLeave = new EventEmitter<
    MapLayerMouseEvent & EventData
  >();
  @Output() layerMouseMove = new EventEmitter<MapLayerMouseEvent & EventData>();
  @Output() layerMouseOver = new EventEmitter<MapLayerMouseEvent & EventData>();
  @Output() layerMouseOut = new EventEmitter<MapLayerMouseEvent & EventData>();
  @Output() layerContextMenu = new EventEmitter<
    MapLayerMouseEvent & EventData
  >();
  @Output() layerTouchStart = new EventEmitter<
    MapLayerTouchEvent & EventData
  >();
  @Output() layerTouchEnd = new EventEmitter<MapLayerTouchEvent & EventData>();
  @Output() layerTouchCancel = new EventEmitter<
    MapLayerTouchEvent & EventData
  >();

  private layerAdded = false;
  private sub: Subscription;

  constructor(private MapService: MapService) {}

  ngOnInit() {
    this.sub = this.MapService.mapLoaded$
      .pipe(
        switchMap(() =>
          fromEvent(<any>this.MapService.mapInstance, 'styledata').pipe(
            mapTo(false),
            filter(() => !this.MapService.mapInstance.getLayer(this.id)),
            startWith(true)
          )
        )
      )
      .subscribe((bindEvents: boolean) => this.init(bindEvents));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.layerAdded) {
      return;
    }
    if (changes.paint && !changes.paint.isFirstChange()) {
      this.MapService.setAllLayerPaintProperty(
        this.id,
        changes.paint.currentValue!
      );
    }
    if (changes.layout && !changes.layout.isFirstChange()) {
      this.MapService.setAllLayerLayoutProperty(
        this.id,
        changes.layout.currentValue!
      );
    }
    if (changes.filter && !changes.filter.isFirstChange()) {
      this.MapService.setLayerFilter(this.id, changes.filter.currentValue!);
    }
    if (changes.before && !changes.before.isFirstChange()) {
      this.MapService.setLayerBefore(this.id, changes.before.currentValue!);
    }
    if (
      (changes.minzoom && !changes.minzoom.isFirstChange()) ||
      (changes.maxzoom && !changes.maxzoom.isFirstChange())
    ) {
      this.MapService.setLayerZoomRange(this.id, this.minzoom, this.maxzoom);
    }
  }

  ngOnDestroy() {
    if (this.layerAdded) {
      this.MapService.removeLayer(this.id);
    }
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  private init(bindEvents: boolean) {
    const layer: SetupLayer = {
      layerOptions: {
        id: this.id,
        type: <any>this.type,
        source: this.source as string,
        metadata: this.metadata,
        'source-layer': this.sourceLayer,
        minzoom: this.minzoom,
        maxzoom: this.maxzoom,
        filter: this.filter,
        layout: this.layout,
        paint: this.paint,
      } as LayerSpecification,
      layerEvents: {
        layerClick: this.layerClick,
        layerDblClick: this.layerDblClick,
        layerMouseDown: this.layerMouseDown,
        layerMouseUp: this.layerMouseUp,
        layerMouseEnter: this.layerMouseEnter,
        layerMouseLeave: this.layerMouseLeave,
        layerMouseMove: this.layerMouseMove,
        layerMouseOver: this.layerMouseOver,
        layerMouseOut: this.layerMouseOut,
        layerContextMenu: this.layerContextMenu,
        layerTouchStart: this.layerTouchStart,
        layerTouchEnd: this.layerTouchEnd,
        layerTouchCancel: this.layerTouchCancel,
      },
    };
    this.MapService.addLayer(layer, bindEvents, this.before);
    this.layerAdded = true;
  }
}
