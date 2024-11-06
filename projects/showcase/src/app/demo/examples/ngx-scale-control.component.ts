import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
  MapComponent,
  ControlComponent,
  ScaleControlDirective,
} from "@maplibre/ngx-maplibre-gl";

@Component({
  selector: "showcase-demo",
  template: `
    <mgl-map
      [style]="
        'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL'
      "
      [preserveDrawingBuffer]="true"
    >
      <mgl-control mglScale unit="imperial" position="top-right"></mgl-control>
    </mgl-map>
  `,
  styleUrls: ["./examples.css"],
  standalone: true,
  imports: [MapComponent, ControlComponent, ScaleControlDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxScaleControlComponent {}
