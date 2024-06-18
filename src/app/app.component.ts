import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { JoinFormComponent } from './join-form/join-form.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, JoinFormComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'chungus-battles-frontend';
}
