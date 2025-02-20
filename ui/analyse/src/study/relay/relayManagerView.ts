import * as licon from 'common/licon';
import { bind, onInsert, dataIcon } from 'common/snabbdom';
import { h, VNode } from 'snabbdom';
import { LogEvent } from './interfaces';
import RelayCtrl from './relayCtrl';
import { memoize } from 'common';

export default function (ctrl: RelayCtrl): VNode | undefined {
  return ctrl.members.canContribute()
    ? h(
        'div.relay-admin',
        {
          hook: onInsert(_ => lichess.asset.loadCssPath('analyse.relay-admin')),
        },
        [
          h('h2', [
            h('span.text', { attrs: dataIcon(licon.RadioTower) }, 'Broadcast manager'),
            h('a', {
              attrs: {
                href: `/broadcast/round/${ctrl.id}/edit`,
                'data-icon': licon.Gear,
              },
            }),
          ]),
          ctrl.data.sync?.url || ctrl.data.sync?.ids
            ? (ctrl.data.sync.ongoing ? stateOn : stateOff)(ctrl)
            : null,
          renderLog(ctrl),
        ],
      )
    : undefined;
}

const logSuccess = (e: LogEvent) => [
  e.moves ? h('strong', '' + e.moves) : e.moves,
  ` new move${e.moves > 1 ? 's' : ''}`,
];

function renderLog(ctrl: RelayCtrl) {
  const url = ctrl.data.sync?.url;
  const logLines = (ctrl.data.sync?.log || [])
    .slice(0)
    .reverse()
    .map(e => {
      const err =
        e.error &&
        h(
          'a',
          url
            ? {
                attrs: {
                  href: url,
                  target: '_blank',
                  rel: 'noopener nofollow',
                },
              }
            : {},
          e.error,
        );
      return h(
        'div' + (err ? '.err' : ''),
        {
          key: e.at,
          attrs: dataIcon(err ? licon.CautionCircle : licon.Checkmark),
        },
        [h('div', [...(err ? [err] : logSuccess(e)), h('time', dateFormatter()(new Date(e.at)))])],
      );
    });
  if (ctrl.loading()) logLines.unshift(h('div.load', [h('i.ddloader'), 'Polling source...']));
  return h('div.log', logLines);
}

function stateOn(ctrl: RelayCtrl) {
  const sync = ctrl.data.sync,
    url = sync?.url,
    ids = sync?.ids;
  return h(
    'div.state.on.clickable',
    {
      hook: bind('click', _ => ctrl.setSync(false)),
      attrs: dataIcon(licon.ChasingArrows),
    },
    [
      h(
        'div',
        url
          ? [
              sync.delay ? `Connected with ${sync.delay}s delay` : 'Connected to source',
              h('br'),
              url.replace(/https?:\/\//, ''),
            ]
          : ids
          ? ['Connected to', h('br'), ids.length, ' game(s)']
          : [],
      ),
    ],
  );
}

const stateOff = (ctrl: RelayCtrl) =>
  h(
    'div.state.off.clickable',
    {
      hook: bind('click', _ => ctrl.setSync(true)),
      attrs: dataIcon(licon.PlayTriangle),
    },
    [h('div.fat', 'Click to connect')],
  );

const dateFormatter = memoize(() =>
  window.Intl && Intl.DateTimeFormat
    ? new Intl.DateTimeFormat(document.documentElement.lang, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      }).format
    : (d: Date) => d.toLocaleString(),
);
