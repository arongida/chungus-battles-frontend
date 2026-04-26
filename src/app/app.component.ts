import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InfoBoxComponent } from './common/components/info-box/info-box.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, InfoBoxComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'chungus-battles-frontend';
}
