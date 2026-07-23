import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TrackingInfo } from '../../core/models';
import { TrackingService } from '../../core/services/tracking.service';
import { TrackingTimelineComponent } from '../../shared/components/tracking-timeline';
import { ButtonComponent } from '../../shared/ui/button';

/** Rastreo de guía (anónimo, sin login). */
@Component({
  selector: 'app-rastrear',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TrackingTimelineComponent, ButtonComponent],
  template: `
    <section class="container page">
      <h2>Rastrea tu guía</h2>
      <form class="bar" (ngSubmit)="search()">
        <input class="input" name="guide" inputmode="numeric" placeholder="Número de guía"
               [(ngModel)]="guide" />
        <app-button type="submit" [disabled]="!guide || loading()">
          {{ loading() ? 'Buscando…' : 'Rastrear' }}
        </app-button>
      </form>

      <p class="samples">Prueba con:
        @for (g of samples; track g) {
          <button class="link" type="button" (click)="use(g)">{{ g }}</button>
        }
      </p>

      @if (error()) { <div class="state state--err">{{ error() }}</div> }
      @if (result(); as r) { <app-tracking-timeline [info]="r" /> }
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding-block: $space-5; max-width: 620px; }
    .bar { display: flex; gap: $space-2; margin: $space-3 0; }
    .bar .input { flex: 1; }
    @include xs-only {
      .bar { flex-direction: column; }
      .bar app-button { display: grid; }
    }
    .samples { font-size: $font-size-micro; color: $color-text-secondary; }
    .link { background: none; border: 0; color: $color-link; cursor: pointer; font: inherit; padding: 0 $space-1; text-decoration: underline; }
    .state { padding: $space-4; border-radius: $rounded; margin-bottom: $space-3; }
    .state--err { background: rgba($red-regular, .08); color: $red-regular; }
  `],
})
export class RastrearPage implements OnInit {
  private readonly tracking = inject(TrackingService);
  private readonly route = inject(ActivatedRoute);

  guide = '';
  readonly samples = this.tracking.sampleGuides;
  readonly loading = signal(false);
  readonly result = signal<TrackingInfo | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const fromUrl = this.route.snapshot.queryParamMap.get('guia');
    if (fromUrl) { this.guide = fromUrl; this.search(); }
  }

  use(g: string): void { this.guide = g; this.search(); }

  search(): void {
    if (!this.guide) return;
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    this.tracking.track(this.guide).subscribe({
      next: (info) => { this.result.set(info); this.loading.set(false); },
      error: (e: Error) => { this.error.set(e.message); this.loading.set(false); },
    });
  }
}
