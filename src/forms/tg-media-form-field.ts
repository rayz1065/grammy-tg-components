import { GetPropsType, GetStateType, TgComponent } from '../tg-components';
import { TgFormField, tgFormFieldDefaultProps } from './tg-form-field';
import { MakeOptional } from '../types/tg-components';
import { ExpandableComponent } from '../expandable-component';
import { Context, Filter } from 'grammy';
import { EventRejectionError } from '../errors';
import { MediaType, getMessageMediaInfo } from 'grammy-edit-or-reply';

type MediaFieldValue = {
  type: MediaType;
  media: string;
};

const MediaTgFormField = TgFormField<MediaFieldValue>;
type MediaTgFormField = TgFormField<MediaFieldValue>;

type State = GetStateType<MediaTgFormField>;
type Props = GetPropsType<MediaTgFormField> & {
  acceptedMediaTypes: MediaType[];
};

const prettyMedia: Record<MediaType, string> = {
  animation: '🎞',
  audio: '🔊',
  document: '📄',
  photo: '🖼',
  video: '🎥',
};

export const tgMediaFormFieldProps = {
  ...tgFormFieldDefaultProps,
  acceptedMediaTypes: ['animation', 'audio', 'document', 'photo', 'video'],
  inlineValuePrinter: (_props, state) =>
    `${state.value ? prettyMedia[state.value.type] : '🌫'}` +
    (state.expanded && state.value !== null ? ' 🗑' : ''),
  textPrinter: (props, state) =>
    (state.expanded ? `<u>${props.label}</>` : props.label) +
    ': ' +
    (state.value !== null
      ? prettyMedia[state.value.type]
      : `<i>${props.placeholder}</>`) +
    '\n' +
    (state.expanded ? props.description : ''),
} satisfies Partial<Props>;

/**
 * A simple form field containing a media with the style of `TgFormField`.
 * When a message input is received it will check whether it contains a media
 * of the right kind, otherwise an `EventRejectionError` will be raised from
 * the handler.
 *
 * Example:
 * ```ts
 * this.mediaField = this.makeChild('m', TgMediaFormField, {
 *   ctx,
 *   label: 'media',
 *   acceptedMediaTypes: ['photo'],
 * });
 * ```
 */
export class TgMediaFormField
  extends TgComponent<State, Props>
  implements ExpandableComponent
{
  handlers = {
    onMessageInput: {
      permanentId: 'm',
      handler: this.onMessageInput.bind(this),
    },
  };

  public field: MediaTgFormField;

  constructor(props: MakeOptional<Props, keyof typeof tgMediaFormFieldProps>) {
    super({ ...tgMediaFormFieldProps, ...props });

    this.field = this.addChild(
      'f',
      new TgFormField({
        ...this.props,
        ...this.getEventProps('f'),
        getState: () => this.props.getState(),
        setState: (state) => this.props.setState(state),
        ...this.memorizeMessageInputRequests('f'),
      })
    );
  }

  public getDefaultState(): State {
    return this.field.getDefaultState();
  }

  public isExpanded() {
    return this.field.isExpanded();
  }

  public collapse() {
    return this.field.collapse();
  }

  public expand() {
    return this.field.expand();
  }

  public toggleExpanded() {
    return this.field.toggleExpanded();
  }

  /**
   * Called when a message input is passed. Will raise `EventRejectionError` if
   * the passed message does not contain a media, or if it contains a media of
   * the wrong type.
   */
  public onMessageInput(messageCtx: Filter<Context, 'message'>) {
    const mediaInfo = getMessageMediaInfo(messageCtx.message);

    if (!mediaInfo) {
      throw new EventRejectionError('tgc.errors.media-required');
    }

    const { acceptedMediaTypes } = this.props;
    if (!acceptedMediaTypes.includes(mediaInfo.type)) {
      throw new EventRejectionError('tgc.errors.media-type-not-accepted', {
        type: mediaInfo.type,
      });
    }

    this.patchState({
      value: {
        media: mediaInfo.fileId,
        type: mediaInfo.type,
      },
    });

    this.collapse();
  }

  async render() {
    const field = await this.field.render();

    if (this.requestedMessageInput['f']) {
      await this.listenForMessageInput(this.handlers.onMessageInput, 'message');
    }

    return field;
  }
}
