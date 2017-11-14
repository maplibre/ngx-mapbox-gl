// Can't use MapEvent interface from @types/mapbox because some event name are changed (eg zoomChange)
import { EventEmitter } from '@angular/core';
import { MapMouseEvent, MapTouchEvent, EventData, MapBoxZoomEvent, Map } from 'mapbox-gl';

export interface MapEvent {
  resize: EventEmitter<void>;
  remove: EventEmitter<void>;
  mouseDown: EventEmitter<MapMouseEvent>;
  mouseUp: EventEmitter<MapMouseEvent>;
  mouseMove: EventEmitter<MapMouseEvent>;
  click: EventEmitter<MapMouseEvent>;
  dblClick: EventEmitter<MapMouseEvent>;
  mouseEnter: EventEmitter<MapMouseEvent>;
  mouseLeave: EventEmitter<MapMouseEvent>;
  mouseOver: EventEmitter<MapMouseEvent>;
  mouseOut: EventEmitter<MapMouseEvent>;
  contextMenu: EventEmitter<MapMouseEvent>;
  touchStart: EventEmitter<MapTouchEvent>;
  touchEnd: EventEmitter<MapTouchEvent>;
  touchMove: EventEmitter<MapTouchEvent>;
  touchCancel: EventEmitter<MapTouchEvent>;
  moveStart: EventEmitter<DragEvent>; // TODO Check type
  move: EventEmitter<MapTouchEvent | MapMouseEvent>;
  moveEnd: EventEmitter<DragEvent>;
  dragStart: EventEmitter<DragEvent>;
  drag: EventEmitter<MapTouchEvent | MapMouseEvent>;
  dragEnd: EventEmitter<DragEvent>;
  zoomStart: EventEmitter<MapTouchEvent | MapMouseEvent>;
  zoomChange: EventEmitter<MapTouchEvent | MapMouseEvent>;
  zoomEnd: EventEmitter<MapTouchEvent | MapMouseEvent>;
  rotateStart: EventEmitter<MapTouchEvent | MapMouseEvent>;
  rotate: EventEmitter<MapTouchEvent | MapMouseEvent>;
  rotateEnd: EventEmitter<MapTouchEvent | MapMouseEvent>;
  pitchStart: EventEmitter<EventData>;
  pitchChange: EventEmitter<EventData>;
  pitchEnd: EventEmitter<EventData>;
  boxZoomStart: EventEmitter<MapBoxZoomEvent>;
  boxZoomEnd: EventEmitter<MapBoxZoomEvent>;
  boxZoomCancel: EventEmitter<MapBoxZoomEvent>;
  webGlContextLost: EventEmitter<void>;
  webGlContextRestored: EventEmitter<void>;
  load: EventEmitter<Map>;
  render: EventEmitter<void>;
  error: EventEmitter<any>; // TODO Check type
  data: EventEmitter<EventData>;
  styleData: EventEmitter<EventData>;
  sourceData: EventEmitter<EventData>;
  dataLoading: EventEmitter<EventData>;
  styleDataLoading: EventEmitter<EventData>;
  sourceDataLoading: EventEmitter<EventData>;
}

export type MapImageData = HTMLImageElement | ImageData | { width: number, height: number, data: Uint8Array | Uint8ClampedArray };

export interface MapImageOptions {
  pixelRatio: number;
  sdf: boolean;
}
