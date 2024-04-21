import { Routes } from '@angular/router';
import { JoinFormComponent } from './join-form/join-form.component';
import { DraftRoomComponent } from './draft/components/draft-room/draft-room.component';
import { draftGuard } from './draft/guards/draft.guard';

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
    canActivate: [draftGuard],
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },

];
