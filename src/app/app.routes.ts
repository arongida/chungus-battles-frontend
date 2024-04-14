import { Routes } from '@angular/router';
import { JoinFormComponent } from './join-form/join-form.component';

export const routes: Routes = [
  {
    path: '',
    component: JoinFormComponent,
    pathMatch: 'full',
  },
  { path: '**', redirectTo: '' },
];
