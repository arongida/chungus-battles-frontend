import { Routes } from '@angular/router';
import { JoinFormComponent } from './join-form/join-form.component';
import { DraftRoomComponent } from './draft-room/draft-room.component';

export const routes: Routes = [
  {
    path: '',
    component: JoinFormComponent,
    pathMatch: 'full',
  },
  {
    path: 'draft/:id',
    component: DraftRoomComponent,
    pathMatch: 'full',
  },
  { path: '**', redirectTo: '' },
];
