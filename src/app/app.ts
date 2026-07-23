import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './shared/layout/nav';
import { FooterComponent } from './shared/layout/footer';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavComponent, FooterComponent],
  template: `
    <app-nav />
    <main class="app-main">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styles: [`
    .app-main { display: block; min-height: calc(100vh - 64px); }
  `],
})
export class App {}
