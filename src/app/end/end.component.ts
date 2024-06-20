import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-end',
  standalone: true,
  imports: [MatButton],
  templateUrl: './end.component.html',
  styleUrl: './end.component.css',
})
export class EndComponent {
  message: string = 'Game Over';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.message = this.route.snapshot.paramMap.get('won') ?? 'Game Over';
  }

  public goToHome() {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('playerId');
    localStorage.removeItem('roomId');
    localStorage.removeItem('reconnectToken');
    this.router.navigate(['/']);
  }
}
