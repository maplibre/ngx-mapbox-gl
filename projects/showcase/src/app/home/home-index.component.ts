import { Component } from '@angular/core';
import { AnimationOptions } from 'maplibre-gl';
import { MatIconModule } from '@angular/material/icon';
import { MapComponent } from '@maplibre/ngx-maplibre-gl';

@Component({
  template: `
    <mgl-map
      [style]="'https://demotiles.maplibre.org/style.json'"
      [zoom]="[2]"
      [center]="center"
      [centerWithPanTo]="true"
      [panToOptions]="panToOptions"
      [interactive]="false"
      (mapLoad)="moveCenter()"
      (moveEnd)="moveCenter()"
    ></mgl-map>
  `,
  styleUrls: ['./home-index.component.scss'],
  standalone: true,
  imports: [MapComponent, MatIconModule],
})
export class HomeIndexComponent {
  center = [0, 0];
  panToOptions: AnimationOptions = { duration: 10000, easing: (t) => t };

  moveCenter() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const targetY = this.center[0];
    if (targetY === 0) {
      this.center = [90, 0];
    } else if (targetY === 90) {
      this.center = [180, 0];
    } else if (targetY === 180) {
      this.center = [-90, 0];
    } else if (targetY === -90) {
      this.center = [0, 0];
    }
  }
}
