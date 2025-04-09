import { Component } from '@angular/core';
import {
  MatStepperModule
} from '@angular/material/stepper';
import {
  MatButtonModule,
} from '@angular/material/button';

@Component({
  selector: 'app-tutorial',
  standalone: true,
  imports: [MatStepperModule, MatButtonModule],
  templateUrl: './tutorial.component.html',
  styleUrl: './tutorial.component.scss',
})
export class TutorialComponent {

}
