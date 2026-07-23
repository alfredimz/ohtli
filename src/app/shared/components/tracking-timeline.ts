import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TrackingInfo } from '../../core/models';
import { BadgeComponent } from '../ui/badge';

const STATUS_LABEL: Record<TrackingInfo['status'], string> = {
  recoleccion: 'En recolección',
  en_camino: 'En camino',
  en_reparto: 'En reparto',
  entregado: 'Entregado',
};

/** TrackingTimeline — historial cronológico de eventos de una guía. */
@Component({
  selector: 'app-tracking-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  template: `
    <div class="tt">
      <header class="tt__head">
        <div>
          <span class="tt__guide">Guía {{ info().guide }}</span>
          <span class="tt__carrier">{{ info().carrier }}</span>
        </div>
        <app-badge [variant]="info().status === 'entregado' ? 'success' : 'info'">
          {{ statusLabel }}
        </app-badge>
      </header>

      <ol class="tt__list">
        @for (e of info().events; track e.date + e.time; let last = $last) {
          <li class="tt__item" [class.is-latest]="last">
            <span class="tt__dot"></span>
            <div class="tt__body">
              <span class="tt__event">{{ e.event }}</span>
              <span class="tt__meta">{{ e.location }} · {{ e.date }} {{ e.time }}</span>
            </div>
          </li>
        }
      </ol>
    </div>
  `,
  styles: [`
    @use 'styles/tokens' as *;

    .tt { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-3; @include md { padding: $space-4; } }
    .tt__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: $space-4; flex-wrap: wrap; gap: $space-2; }
    .tt__guide { display: block; font-weight: $font-weight-black; color: $purple-regular; font-size: $font-size-card; }
    .tt__carrier { font-size: $font-size-body; color: $color-text-secondary; }

    .tt__list { list-style: none; margin: 0; padding: 0; }
    .tt__item { display: flex; gap: $space-3; padding-bottom: $space-4; position: relative; }
    .tt__item::before {
      content: ''; position: absolute; left: 6px; top: 16px; bottom: 0; width: 2px; background: $dimgray-light-3;
    }
    .tt__item:last-child::before { display: none; }
    .tt__dot { width: 14px; height: 14px; border-radius: $rounded-full; background: $dimgray-light-3; margin-top: 2px; z-index: 1; flex-shrink: 0; }
    .tt__item.is-latest .tt__dot { background: $green-regular; }
    .tt__body { display: flex; flex-direction: column; }
    .tt__event { font-weight: $font-weight-semibold; }
    .tt__meta { font-size: $font-size-micro; color: $color-text-secondary; }
  `],
})
export class TrackingTimelineComponent {
  readonly info = input.required<TrackingInfo>();
  protected get statusLabel(): string { return STATUS_LABEL[this.info().status]; }
}
