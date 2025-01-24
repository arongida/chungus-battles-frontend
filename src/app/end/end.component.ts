import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Player } from '../models/colyseus-schema/PlayerSchema';
import { environment } from '../../environments/environment';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-end',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './end.component.html',
  styleUrl: './end.component.scss',
})
export class EndComponent {
  message: string = 'Game Over';
  topPlayers: Player[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  async ngOnInit() {
    const url = `${environment.expressServer}/topPlayers?numberOfPlayers=10`;
    const result = await fetch(url)
    .then((res) => res.json())
    .catch((e) => console.error(e));
  
    console.log('result: ', result);

    this.topPlayers = result;
  }

  public goToHome() {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('playerId');
    localStorage.removeItem('roomId');
    localStorage.removeItem('reconnectToken');
    this.router.navigate(['/']);
  }
}
