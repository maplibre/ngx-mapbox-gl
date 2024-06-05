import { AfterContentInit, Directive, Host, input } from '@angular/core';
import { NavigationControl } from 'maplibre-gl';
import { MapService } from '../map/map.service';
import { ControlComponent } from './control.component';

/**
 * `mglNavigation` - a navigation control directive
 * 
 * @category Directives
 * 
 * @see [Navigation](https://maplibre.org/ngx-maplibre-gl/demo/navigation)
 * @see [NavigationControl](https://maplibre.org/maplibre-gl-js/docs/API/classes/NavigationControl)
 */
@Directive({
  selector: '[mglNavigation]',
  standalone: true,
})
export class NavigationControlDirective implements AfterContentInit {
  /* Init inputs */
  showCompass = input<boolean>();
  showZoom = input<boolean>();
  visualizePitch = input<boolean>();

  constructor(
    private mapService: MapService,
    @Host() private controlComponent: ControlComponent<NavigationControl>
  ) {}

  ngAfterContentInit() {
    this.mapService.mapCreated$.subscribe(() => {
      if (this.controlComponent.control) {
        throw new Error('Another control is already set for this control');
      }

      const options: {
        showCompass?: boolean;
        showZoom?: boolean;
        visualizePitch?: boolean;
      } = {};

      if (this.showCompass() !== undefined) {
        options.showCompass = this.showCompass();
      }

      if (this.showZoom() !== undefined) {
        options.showZoom = this.showZoom();
      }

      if (this.visualizePitch() !== undefined) {
        options.visualizePitch = this.visualizePitch();
      }

      this.controlComponent.control = new NavigationControl(options);
      this.mapService.addControl(
        this.controlComponent.control,
        this.controlComponent.position()
      );
    });
  }
}
