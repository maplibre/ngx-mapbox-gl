import { EventEmitter, Injectable, NgZone } from '@angular/core';
import {
  CameraOptions,
  FlyToOptions,
  LngLatLike,
  MapOptions,
  MarkerOptions,
  PopupOptions,
  Map,
  Marker,
  Popup,
  AnimationOptions,
  LayerSpecification,
  StyleSpecification,
  LngLatBoundsLike,
  PointLike,
  IControl,
  SourceSpecification,
  FitBoundsOptions,
  Source,
  BackgroundLayerSpecification,
  FillLayerSpecification,
  FillExtrusionLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
  RasterLayerSpecification,
  CircleLayerSpecification,
  FilterSpecification,
  TerrainSpecification,
} from 'maplibre-gl';
import { AsyncSubject, Observable, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import {
  LayerEvents,
  MapEvent,
  MapImageData,
  MapImageOptions,
} from './map.types';

export interface SetupMap {
  mapOptions: Omit<MapOptions, 'bearing' | 'pitch' | 'zoom'> & {
    bearing?: [number];
    pitch?: [number];
    zoom?: [number];
    terrain?: TerrainSpecification;
  };
  mapEvents: MapEvent;
}

export interface SetupLayer {
  layerOptions: LayerSpecification;
  layerEvents: LayerEvents;
}

export interface SetupPopup {
  popupOptions: PopupOptions;
  popupEvents: {
    popupOpen: EventEmitter<void>;
    popupClose: EventEmitter<void>;
  };
}

export interface SetupMarker {
  markersOptions: {
    pitchAlignment?: MarkerOptions['pitchAlignment'];
    rotationAlignment?: MarkerOptions['rotationAlignment'];
    offset?: MarkerOptions['offset'];
    anchor?: MarkerOptions['anchor'];
    draggable?: MarkerOptions['draggable'];
    element: HTMLElement;
    feature?: GeoJSON.Feature<GeoJSON.Point>;
    lngLat?: LngLatLike;
    clickTolerance?: MarkerOptions['clickTolerance'];
  };
  markersEvents: {
    markerDragStart: EventEmitter<Marker>;
    markerDrag: EventEmitter<Marker>;
    markerDragEnd: EventEmitter<Marker>;
  };
}

export type MovingOptions =
  | FlyToOptions
  | (AnimationOptions & CameraOptions)
  | CameraOptions;

@Injectable()
export class MapService {
  mapInstance: Map;
  mapCreated$: Observable<void>;
  mapLoaded$: Observable<void>;
  mapEvents: MapEvent;

  private mapCreated = new AsyncSubject<void>();
  private mapLoaded = new AsyncSubject<void>();
  private markersToRemove: Marker[] = [];
  private popupsToRemove: Popup[] = [];
  private imageIdsToRemove: string[] = [];
  private subscription = new Subscription();

  constructor(private zone: NgZone) {
    this.mapCreated$ = this.mapCreated.asObservable();
    this.mapLoaded$ = this.mapLoaded.asObservable();
  }

  setup(options: SetupMap) {
    // Need onStable to wait for a potential @angular/route transition to end
    this.zone.onStable.pipe(first()).subscribe(() => {
      // Workaround rollup issue
      this.createMap(options.mapOptions as MapOptions);
      this.hookEvents(options.mapEvents);
      this.mapEvents = options.mapEvents;
      this.mapCreated.next(undefined);
      this.mapCreated.complete();

      if (options.mapOptions.terrain) {
        this.mapInstance.on('load', () => {
          this.updateTerrain(options.mapOptions.terrain!);
        });
      }
    });
  }

  destroyMap() {
    if (this.mapInstance) {
      this.subscription.unsubscribe();
      this.mapInstance.remove();
    }
  }

  updateMinZoom(minZoom: number) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.setMinZoom(minZoom);
    });
  }

  updateMaxZoom(maxZoom: number) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.setMaxZoom(maxZoom);
    });
  }

  updateMinPitch(minPitch: number) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.setMinPitch(minPitch);
    });
  }

  updateMaxPitch(maxPitch: number) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.setMaxPitch(maxPitch);
    });
  }

  updateRenderWorldCopies(status: boolean) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.setRenderWorldCopies(status);
    });
  }

  updateScrollZoom(status: boolean) {
    return this.zone.runOutsideAngular(() => {
      status
        ? this.mapInstance.scrollZoom.enable()
        : this.mapInstance.scrollZoom.disable();
    });
  }

  updateDragRotate(status: boolean) {
    return this.zone.runOutsideAngular(() => {
      status
        ? this.mapInstance.dragRotate.enable()
        : this.mapInstance.dragRotate.disable();
    });
  }

  updateTouchPitch(status: boolean) {
    return this.zone.runOutsideAngular(() => {
      status
        ? this.mapInstance.touchPitch.enable()
        : this.mapInstance.touchPitch.disable();
    });
  }

  updateTouchZoomRotate(status: boolean) {
    return this.zone.runOutsideAngular(() => {
      status
        ? this.mapInstance.touchZoomRotate.enable()
        : this.mapInstance.touchZoomRotate.disable();
    });
  }

  updateDoubleClickZoom(status: boolean) {
    return this.zone.runOutsideAngular(() => {
      status
        ? this.mapInstance.doubleClickZoom.enable()
        : this.mapInstance.doubleClickZoom.disable();
    });
  }

  updateKeyboard(status: boolean) {
    return this.zone.runOutsideAngular(() => {
      status
        ? this.mapInstance.keyboard.enable()
        : this.mapInstance.keyboard.disable();
    });
  }

  updateDragPan(status: boolean) {
    return this.zone.runOutsideAngular(() => {
      status
        ? this.mapInstance.dragPan.enable()
        : this.mapInstance.dragPan.disable();
    });
  }

  updateBoxZoom(status: boolean) {
    return this.zone.runOutsideAngular(() => {
      status
        ? this.mapInstance.boxZoom.enable()
        : this.mapInstance.boxZoom.disable();
    });
  }

  updateStyle(style: StyleSpecification) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.setStyle(style);
    });
  }

  updateMaxBounds(maxBounds: LngLatBoundsLike) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.setMaxBounds(maxBounds);
    });
  }

  updateTerrain(options: TerrainSpecification) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.setTerrain(options);
    });
  }

  getTerrain(): TerrainSpecification {
    return this.zone.runOutsideAngular(() => {
      return this.mapInstance.getTerrain();
    });
  }

  changeCanvasCursor(cursor: string) {
    const canvas = this.mapInstance.getCanvasContainer();
    canvas.style.cursor = cursor;
  }

  queryRenderedFeatures(
    pointOrBox?: PointLike | [PointLike, PointLike],
    parameters?: { layers?: string[]; filter?: any[] }
  ): GeoJSON.Feature<GeoJSON.GeometryObject>[] {
    return this.mapInstance.queryRenderedFeatures(pointOrBox, parameters);
  }

  panTo(center: LngLatLike, options?: AnimationOptions) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.panTo(center, options);
    });
  }

  move(
    movingMethod: 'jumpTo' | 'easeTo' | 'flyTo',
    movingOptions?: MovingOptions,
    zoom?: number,
    center?: LngLatLike,
    bearing?: number,
    pitch?: number
  ) {
    return this.zone.runOutsideAngular(() => {
      (this.mapInstance[movingMethod] as any)({
        ...movingOptions,
        zoom: zoom != null ? zoom : this.mapInstance.getZoom(),
        center: center != null ? center : this.mapInstance.getCenter(),
        bearing: bearing != null ? bearing : this.mapInstance.getBearing(),
        pitch: pitch != null ? pitch : this.mapInstance.getPitch(),
      });
    });
  }

  addLayer(layer: SetupLayer, bindEvents: boolean, before?: string) {
    this.zone.runOutsideAngular(() => {
      Object.keys(layer.layerOptions).forEach((key: string) => {
        const tkey = <keyof LayerSpecification>key;
        if (layer.layerOptions[tkey] === undefined) {
          delete layer.layerOptions[tkey];
        }
      });
      this.mapInstance.addLayer(
        layer.layerOptions as LayerSpecification,
        before
      );
      if (bindEvents) {
        if (layer.layerEvents.layerClick.observers.length) {
          this.mapInstance.on('click', layer.layerOptions.id, (evt) => {
            this.zone.run(() => {
              layer.layerEvents.layerClick.emit(evt);
            });
          });
        }
        if (layer.layerEvents.layerDblClick.observers.length) {
          this.mapInstance.on('dblclick', layer.layerOptions.id, (evt) => {
            this.zone.run(() => {
              layer.layerEvents.layerDblClick.emit(evt);
            });
          });
        }
        if (layer.layerEvents.layerMouseDown.observers.length) {
          this.mapInstance.on('mousedown', layer.layerOptions.id, (evt) => {
            this.zone.run(() => {
              layer.layerEvents.layerMouseDown.emit(evt);
            });
          });
        }
        if (layer.layerEvents.layerMouseUp.observers.length) {
          this.mapInstance.on('mouseup', layer.layerOptions.id, (evt) => {
            this.zone.run(() => {
              layer.layerEvents.layerMouseUp.emit(evt);
            });
          });
        }
        if (layer.layerEvents.layerMouseEnter.observers.length) {
          this.mapInstance.on('mouseenter', layer.layerOptions.id, (evt) => {
            this.zone.run(() => {
              layer.layerEvents.layerMouseEnter.emit(evt);
            });
          });
        }
        if (layer.layerEvents.layerMouseLeave.observers.length) {
          this.mapInstance.on('mouseleave', layer.layerOptions.id, (evt) => {
            this.zone.run(() => {
              layer.layerEvents.layerMouseLeave.emit(evt);
            });
          });
        }
        if (layer.layerEvents.layerMouseMove.observers.length) {
          this.mapInstance.on('mousemove', layer.layerOptions.id, (evt) => {
            this.zone.run(() => {
              layer.layerEvents.layerMouseMove.emit(evt);
            });
          });
        }
        if (layer.layerEvents.layerMouseOver.observers.length) {
          this.mapInstance.on('mouseover', layer.layerOptions.id, (evt) => {
            this.zone.run(() => {
              layer.layerEvents.layerMouseOver.emit(evt);
            });
          });
        }
        if (layer.layerEvents.layerMouseOut.observers.length) {
          this.mapInstance.on('mouseout', layer.layerOptions.id, (evt) => {
            this.zone.run(() => {
              layer.layerEvents.layerMouseOut.emit(evt);
            });
          });
        }
        if (layer.layerEvents.layerContextMenu.observers.length) {
          this.mapInstance.on('contextmenu', layer.layerOptions.id, (evt) => {
            this.zone.run(() => {
              layer.layerEvents.layerContextMenu.emit(evt);
            });
          });
        }
        if (layer.layerEvents.layerTouchStart.observers.length) {
          this.mapInstance.on('touchstart', layer.layerOptions.id, (evt) => {
            this.zone.run(() => {
              layer.layerEvents.layerTouchStart.emit(evt);
            });
          });
        }
        if (layer.layerEvents.layerTouchEnd.observers.length) {
          this.mapInstance.on('touchend', layer.layerOptions.id, (evt) => {
            this.zone.run(() => {
              layer.layerEvents.layerTouchEnd.emit(evt);
            });
          });
        }
        if (layer.layerEvents.layerTouchCancel.observers.length) {
          this.mapInstance.on('touchcancel', layer.layerOptions.id, (evt) => {
            this.zone.run(() => {
              layer.layerEvents.layerTouchCancel.emit(evt);
            });
          });
        }
      }
    });
  }

  removeLayer(layerId: string) {
    this.zone.runOutsideAngular(() => {
      if (this.mapInstance.getLayer(layerId) != null) {
        this.mapInstance.removeLayer(layerId);
      }
    });
  }

  addMarker(marker: SetupMarker) {
    const options: MarkerOptions = {
      offset: marker.markersOptions.offset,
      anchor: marker.markersOptions.anchor,
      draggable: !!marker.markersOptions.draggable,
      rotationAlignment: marker.markersOptions.rotationAlignment,
      pitchAlignment: marker.markersOptions.pitchAlignment,
      clickTolerance: marker.markersOptions.clickTolerance,
    };
    if (marker.markersOptions.element.childNodes.length > 0) {
      options.element = marker.markersOptions.element;
    }
    const markerInstance = new Marker(options);
    if (marker.markersEvents.markerDragStart.observers.length) {
      markerInstance.on('dragstart', (event: { target: Marker }) => {
        if (event) {
          const { target } = event;
          this.zone.run(() => {
            marker.markersEvents.markerDragStart.emit(target);
          });
        }
      });
    }
    /*

     */
    if (marker.markersEvents.markerDrag.observers.length) {
      markerInstance.on('drag', (event: { target: Marker }) => {
        if (event) {
          const { target } = event;
          this.zone.run(() => {
            marker.markersEvents.markerDrag.emit(target);
          });
        }
      });
    }
    if (marker.markersEvents.markerDragEnd.observers.length) {
      markerInstance.on('dragend', (event: { target: Marker }) => {
        if (event) {
          const { target } = event;
          this.zone.run(() => {
            marker.markersEvents.markerDragEnd.emit(target);
          });
        }
      });
    }
    const lngLat: LngLatLike = marker.markersOptions.feature
      ? <[number, number]>marker.markersOptions.feature.geometry!.coordinates
      : marker.markersOptions.lngLat!;
    markerInstance.setLngLat(lngLat);
    return this.zone.runOutsideAngular(() => {
      markerInstance.addTo(this.mapInstance);
      return markerInstance;
    });
  }

  removeMarker(marker: Marker) {
    this.markersToRemove.push(marker);
  }

  createPopup(popup: SetupPopup, element: Node) {
    return this.zone.runOutsideAngular(() => {
      Object.keys(popup.popupOptions).forEach(
        (key) =>
          (popup.popupOptions as any)[key] === undefined &&
          delete (popup.popupOptions as any)[key]
      );
      const popupInstance = new Popup(popup.popupOptions);
      popupInstance.setDOMContent(element);
      if (popup.popupEvents.popupClose.observers.length) {
        popupInstance.on('close', () => {
          this.zone.run(() => {
            popup.popupEvents.popupClose.emit();
          });
        });
      }
      if (popup.popupEvents.popupOpen.observers.length) {
        popupInstance.on('open', () => {
          this.zone.run(() => {
            popup.popupEvents.popupOpen.emit();
          });
        });
      }
      return popupInstance;
    });
  }

  addPopupToMap(popup: Popup, lngLat: LngLatLike, skipOpenEvent = false) {
    return this.zone.runOutsideAngular(() => {
      if (skipOpenEvent && popup._listeners) {
        delete popup._listeners['open'];
      }
      popup.setLngLat(lngLat);
      popup.addTo(this.mapInstance);
    });
  }

  addPopupToMarker(marker: Marker, popup: Popup) {
    return this.zone.runOutsideAngular(() => {
      marker.setPopup(popup);
    });
  }

  removePopupFromMap(popup: Popup, skipCloseEvent = false) {
    if (skipCloseEvent && popup._listeners) {
      delete popup._listeners['close'];
    }
    this.popupsToRemove.push(popup);
  }

  removePopupFromMarker(marker: Marker) {
    return this.zone.runOutsideAngular(() => {
      marker.setPopup(undefined);
    });
  }

  addControl(
    control: IControl,
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  ) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.addControl(control, position);
    });
  }

  removeControl(control: IControl) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.removeControl(control);
    });
  }

  async loadAndAddImage(
    imageId: string,
    url: string,
    options?: MapImageOptions
  ) {
    return this.zone.runOutsideAngular(() => {
      return new Promise<void>((resolve, reject) => {
        this.mapInstance.loadImage(url, (error: any, image: any) => {
          if (error) {
            reject(error);
            return;
          }
          this.addImage(imageId, image, options);
          resolve();
        });
      });
    });
  }

  addImage(imageId: string, data: MapImageData, options?: MapImageOptions) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.addImage(imageId, data as any, options);
    });
  }

  removeImage(imageId: string) {
    this.imageIdsToRemove.push(imageId);
  }

  addSource(sourceId: string, source: SourceSpecification) {
    return this.zone.runOutsideAngular(() => {
      Object.keys(source).forEach(
        (key) =>
          (source as any)[key] === undefined && delete (source as any)[key]
      );
      this.mapInstance.addSource(sourceId, source);
    });
  }

  getSource<T extends Source>(sourceId: string): T {
    return <T>this.mapInstance.getSource(sourceId);
  }

  removeSource(sourceId: string) {
    this.zone.runOutsideAngular(() => {
      this.findLayersBySourceId(sourceId).forEach((layer) =>
        this.mapInstance.removeLayer(layer.id)
      );
      this.mapInstance.removeSource(sourceId);
    });
  }

  setAllLayerPaintProperty(
    layerId: string,
    paint:
      | BackgroundLayerSpecification['paint']
      | FillLayerSpecification['paint']
      | FillExtrusionLayerSpecification['paint']
      | LineLayerSpecification['paint']
      | SymbolLayerSpecification['paint']
      | RasterLayerSpecification['paint']
      | CircleLayerSpecification['paint']
  ) {
    return this.zone.runOutsideAngular(() => {
      Object.keys(paint as any).forEach((key) => {
        // TODO Check for perf, setPaintProperty only on changed paint props maybe
        this.mapInstance.setPaintProperty(layerId, key, (paint as any)[key]);
      });
    });
  }

  setAllLayerLayoutProperty(
    layerId: string,
    layout:
      | BackgroundLayerSpecification['layout']
      | FillLayerSpecification['layout']
      | FillExtrusionLayerSpecification['layout']
      | LineLayerSpecification['layout']
      | SymbolLayerSpecification['layout']
      | RasterLayerSpecification['layout']
      | CircleLayerSpecification['layout']
  ) {
    return this.zone.runOutsideAngular(() => {
      Object.keys(layout as any).forEach((key) => {
        // TODO Check for perf, setPaintProperty only on changed paint props maybe
        this.mapInstance.setLayoutProperty(layerId, key, (layout as any)[key]);
      });
    });
  }

  setLayerFilter(
    layerId: string,
    filter: FilterSpecification | null | undefined
  ) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.setFilter(layerId, filter);
    });
  }

  setLayerBefore(layerId: string, beforeId: string) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.moveLayer(layerId, beforeId);
    });
  }

  setLayerZoomRange(layerId: string, minZoom?: number, maxZoom?: number) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.setLayerZoomRange(
        layerId,
        minZoom ? minZoom : 0,
        maxZoom ? maxZoom : 20
      );
    });
  }

  fitBounds(bounds: LngLatBoundsLike, options?: FitBoundsOptions) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.fitBounds(bounds, options);
    });
  }

  fitScreenCoordinates(
    points: [PointLike, PointLike],
    bearing: number,
    options?: AnimationOptions & CameraOptions
  ) {
    return this.zone.runOutsideAngular(() => {
      this.mapInstance.fitScreenCoordinates(
        points[0],
        points[1],
        bearing,
        options
      );
    });
  }

  applyChanges() {
    this.zone.runOutsideAngular(() => {
      this.removeMarkers();
      this.removePopups();
      this.removeImages();
    });
  }

  private createMap(options: MapOptions) {
    NgZone.assertNotInAngularZone();
    Object.keys(options).forEach((key: string) => {
      const tkey = <keyof MapOptions>key;
      if (options[tkey] === undefined) {
        delete options[tkey];
      }
    });
    this.mapInstance = new Map(options);

    const isIEorEdge =
      window && /msie\s|trident\/|edge\//i.test(window.navigator.userAgent);
    if (isIEorEdge) {
      this.mapInstance.setStyle(options.style!);
    }

    this.subscription.add(
      this.zone.onMicrotaskEmpty.subscribe(() => this.applyChanges())
    );
  }

  private removeMarkers() {
    for (const marker of this.markersToRemove) {
      marker.remove();
    }
    this.markersToRemove = [];
  }

  private removePopups() {
    for (const popup of this.popupsToRemove) {
      popup.remove();
    }
    this.popupsToRemove = [];
  }

  private removeImages() {
    for (const imageId of this.imageIdsToRemove) {
      this.mapInstance.removeImage(imageId);
    }
    this.imageIdsToRemove = [];
  }

  private findLayersBySourceId(sourceId: string): LayerSpecification[] {
    const layers = this.mapInstance.getStyle().layers;
    if (layers == null) {
      return [];
    }

    return layers.filter((l) =>
      'source' in l ? l.source === sourceId : false
    );
  }

  private hookEvents(events: MapEvent) {
    this.mapInstance.on('load', (evt) => {
      this.mapLoaded.next(undefined);
      this.mapLoaded.complete();
      this.zone.run(() => {
        events.mapLoad.emit(evt.target);
      });
    });
    if (events.mapResize.observers.length) {
      this.mapInstance.on('resize', (evt) =>
        this.zone.run(() => {
          events.mapResize.emit(evt);
        })
      );
    }
    if (events.mapRemove.observers.length) {
      this.mapInstance.on('remove', (evt) =>
        this.zone.run(() => {
          events.mapRemove.emit(evt);
        })
      );
    }
    if (events.mapMouseDown.observers.length) {
      this.mapInstance.on('mousedown', (evt) =>
        this.zone.run(() => {
          events.mapMouseDown.emit(evt);
        })
      );
    }
    if (events.mapMouseUp.observers.length) {
      this.mapInstance.on('mouseup', (evt) =>
        this.zone.run(() => {
          events.mapMouseUp.emit(evt);
        })
      );
    }
    if (events.mapMouseMove.observers.length) {
      this.mapInstance.on('mousemove', (evt) =>
        this.zone.run(() => {
          events.mapMouseMove.emit(evt);
        })
      );
    }
    if (events.mapClick.observers.length) {
      this.mapInstance.on('click', (evt) =>
        this.zone.run(() => {
          events.mapClick.emit(evt);
        })
      );
    }
    if (events.mapDblClick.observers.length) {
      this.mapInstance.on('dblclick', (evt) =>
        this.zone.run(() => {
          events.mapDblClick.emit(evt);
        })
      );
    }
    if (events.mapMouseOver.observers.length) {
      this.mapInstance.on('mouseover', (evt) =>
        this.zone.run(() => {
          events.mapMouseOver.emit(evt);
        })
      );
    }
    if (events.mapMouseOut.observers.length) {
      this.mapInstance.on('mouseout', (evt) =>
        this.zone.run(() => {
          events.mapMouseOut.emit(evt);
        })
      );
    }
    if (events.mapContextMenu.observers.length) {
      this.mapInstance.on('contextmenu', (evt) =>
        this.zone.run(() => {
          events.mapContextMenu.emit(evt);
        })
      );
    }
    if (events.mapTouchStart.observers.length) {
      this.mapInstance.on('touchstart', (evt) =>
        this.zone.run(() => {
          events.mapTouchStart.emit(evt);
        })
      );
    }
    if (events.mapTouchEnd.observers.length) {
      this.mapInstance.on('touchend', (evt) =>
        this.zone.run(() => {
          events.mapTouchEnd.emit(evt);
        })
      );
    }
    if (events.mapTouchMove.observers.length) {
      this.mapInstance.on('touchmove', (evt) =>
        this.zone.run(() => {
          events.mapTouchMove.emit(evt);
        })
      );
    }
    if (events.mapTouchCancel.observers.length) {
      this.mapInstance.on('touchcancel', (evt) =>
        this.zone.run(() => {
          events.mapTouchCancel.emit(evt);
        })
      );
    }
    if (events.mapWheel.observers.length) {
      this.mapInstance.on('wheel', (evt) =>
        this.zone.run(() => {
          events.mapWheel.emit(evt);
        })
      );
    }
    if (events.moveStart.observers.length) {
      this.mapInstance.on('movestart', (evt) =>
        this.zone.run(() => events.moveStart.emit(evt))
      );
    }
    if (events.move.observers.length) {
      this.mapInstance.on('move', (evt) =>
        this.zone.run(() => events.move.emit(evt))
      );
    }
    if (events.moveEnd.observers.length) {
      this.mapInstance.on('moveend', (evt) =>
        this.zone.run(() => events.moveEnd.emit(evt))
      );
    }
    if (events.mapDragStart.observers.length) {
      this.mapInstance.on('dragstart', (evt) =>
        this.zone.run(() => {
          events.mapDragStart.emit(evt);
        })
      );
    }
    if (events.mapDrag.observers.length) {
      this.mapInstance.on('drag', (evt) =>
        this.zone.run(() => {
          events.mapDrag.emit(evt);
        })
      );
    }
    if (events.mapDragEnd.observers.length) {
      this.mapInstance.on('dragend', (evt) =>
        this.zone.run(() => {
          events.mapDragEnd.emit(evt);
        })
      );
    }
    if (events.zoomStart.observers.length) {
      this.mapInstance.on('zoomstart', (evt) =>
        this.zone.run(() => events.zoomStart.emit(evt))
      );
    }
    if (events.zoomEvt.observers.length) {
      this.mapInstance.on('zoom', (evt) =>
        this.zone.run(() => events.zoomEvt.emit(evt))
      );
    }
    if (events.zoomEnd.observers.length) {
      this.mapInstance.on('zoomend', (evt) =>
        this.zone.run(() => events.zoomEnd.emit(evt))
      );
    }
    if (events.rotateStart.observers.length) {
      this.mapInstance.on('rotatestart', (evt) =>
        this.zone.run(() => events.rotateStart.emit(evt))
      );
    }
    if (events.rotate.observers.length) {
      this.mapInstance.on('rotate', (evt) =>
        this.zone.run(() => events.rotate.emit(evt))
      );
    }
    if (events.rotateEnd.observers.length) {
      this.mapInstance.on('rotateend', (evt) =>
        this.zone.run(() => events.rotateEnd.emit(evt))
      );
    }
    if (events.pitchStart.observers.length) {
      this.mapInstance.on('pitchstart', (evt) =>
        this.zone.run(() => events.pitchStart.emit(evt))
      );
    }
    if (events.pitchEvt.observers.length) {
      this.mapInstance.on('pitch', (evt) =>
        this.zone.run(() => events.pitchEvt.emit(evt))
      );
    }
    if (events.pitchEnd.observers.length) {
      this.mapInstance.on('pitchend', (evt) =>
        this.zone.run(() => events.pitchEnd.emit(evt))
      );
    }
    if (events.boxZoomStart.observers.length) {
      this.mapInstance.on('boxzoomstart', (evt) =>
        this.zone.run(() => events.boxZoomStart.emit(evt))
      );
    }
    if (events.boxZoomEnd.observers.length) {
      this.mapInstance.on('boxzoomend', (evt) =>
        this.zone.run(() => events.boxZoomEnd.emit(evt))
      );
    }
    if (events.boxZoomCancel.observers.length) {
      this.mapInstance.on('boxzoomcancel', (evt) =>
        this.zone.run(() => events.boxZoomCancel.emit(evt))
      );
    }
    if (events.webGlContextLost.observers.length) {
      this.mapInstance.on('webglcontextlost', (evt) =>
        this.zone.run(() => events.webGlContextLost.emit(evt))
      );
    }
    if (events.webGlContextRestored.observers.length) {
      this.mapInstance.on('webglcontextrestored', (evt) =>
        this.zone.run(() => events.webGlContextRestored.emit(evt))
      );
    }
    if (events.render.observers.length) {
      this.mapInstance.on('render', (evt) =>
        this.zone.run(() => events.render.emit(evt))
      );
    }
    if (events.mapError.observers.length) {
      this.mapInstance.on('error', (evt) =>
        this.zone.run(() => {
          events.mapError.emit(evt);
        })
      );
    }
    if (events.data.observers.length) {
      this.mapInstance.on('data', (evt) =>
        this.zone.run(() => events.data.emit(evt))
      );
    }
    if (events.styleData.observers.length) {
      this.mapInstance.on('styledata', (evt) =>
        this.zone.run(() => events.styleData.emit(evt))
      );
    }
    if (events.sourceData.observers.length) {
      this.mapInstance.on('sourcedata', (evt) =>
        this.zone.run(() => events.sourceData.emit(evt))
      );
    }
    if (events.dataLoading.observers.length) {
      this.mapInstance.on('dataloading', (evt) =>
        this.zone.run(() => events.dataLoading.emit(evt))
      );
    }
    if (events.styleDataLoading.observers.length) {
      this.mapInstance.on('styledataloading', (evt) =>
        this.zone.run(() => events.styleDataLoading.emit(evt))
      );
    }
    if (events.sourceDataLoading.observers.length) {
      this.mapInstance.on('sourcedataloading', (evt) =>
        this.zone.run(() => events.sourceDataLoading.emit(evt))
      );
    }
    if (events.styleImageMissing.observers.length) {
      this.mapInstance.on('styleimagemissing', (evt) =>
        this.zone.run(() => events.styleImageMissing.emit(evt))
      );
    }
    if (events.idle.observers.length) {
      this.mapInstance.on('idle', (evt) =>
        this.zone.run(() => events.idle.emit(evt))
      );
    }
  }
}
