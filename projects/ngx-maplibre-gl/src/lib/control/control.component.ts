import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  afterNextRender,
  inject,
} from '@angular/core';
import { ControlPosition, IControl } from 'maplibre-gl';
import { MapService } from '../map/map.service';
import { Platform } from '@angular/cdk/platform';

export class CustomControl implements IControl {
  constructor(private container: HTMLElement) {}

  onAdd() {
    return this.container;
  }

  onRemove() {
    return this.container.parentNode!.removeChild(this.container);
  }

  getDefaultPosition(): ControlPosition {
    return 'top-right';
  }
}

/**
 * `mgl-control` - a custom control component
 * @see [Controls](https://maplibre.org/maplibre-gl-js/docs/API/interfaces/IControl/)
 *
 * @category Components
 *
 * @example
 * ```html
 * ...
 * <mgl-map ...>
 *   <mgl-control> Hello </mgl-control>
 *   ...
 *   <mgl-control mglNavigation></mgl-control>
 *   ...
 *   <mgl-control mglScale unit="imperial" position="top-right"></mgl-control>
 *   ...
 *   <mgl-control
 *     mglTerrain
 *     source="rasterDemSource"
 *     exaggeration="3.1"
 *   ></mgl-control>
 * </mgl-map>
 * ```
 */
@Component({
  selector: 'mgl-control',
  template:
    '<div class="maplibregl-ctrl" #content><ng-content></ng-content></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class ControlComponent<T extends IControl> implements OnDestroy {
  /** Init input */
  @Input() position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** @hidden */
  @ViewChild('content', { static: true }) content: ElementRef;

  control: T | CustomControl;

  private _isBrowser = inject(Platform).isBrowser;

  constructor(private mapService: MapService) {
    afterNextRender(() => {
      if (this.content.nativeElement.childNodes.length) {
        this.control = new CustomControl(this.content.nativeElement);
        this.mapService.mapCreated$.subscribe(() => {
          this.mapService.addControl(this.control!, this.position);
        });
      }
    });
  }

  ngOnDestroy() {
    if (this._isBrowser) {
      if (this.mapService.mapInstance.hasControl(this.control)) {
        this.mapService.removeControl(this.control);
      }
    }
  }
}
