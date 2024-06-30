import { Context, Filter } from 'grammy';
import { ExpandableComponent } from '../expandable-component';
import { GetPropsType, GetStateType, TgComponent } from '../tg-components';
import { TgPagination, renderAsButtonsGrid } from '../components/tg-pagination';
import {
  MakeOptional,
  MaybeLazyProperty,
  TgDefaultProps,
} from '../types/tg-components';
import { selectedBtnText } from '../utils';
import { TgFormField, tgFormFieldDefaultProps } from './tg-form-field';

type OptionType<T> = {
  label: string;
  value: T;
};

type Props<T> = {
  options: MaybeLazyProperty<OptionType<T>[], State<T>>;
  paginationProps?: Partial<GetPropsType<TgPagination>>;
} & TgDefaultProps<State<T>> &
  Omit<GetPropsType<TgFormField<T>>, keyof TgDefaultProps<any> | 'perPage'>;

export const tgSelectFormFieldDefaultProps = {
  ...tgFormFieldDefaultProps,
};

type State<T> = {
  filter: string | null;
  p: GetStateType<TgPagination<OptionType<T>>>;
} & GetStateType<TgFormField<T>>;

/**
 * Returns a function that filters and paginates the options based on the
 * state, useful when only a few options need to be loaded.
 */
export function basicFilteredOptions<T>(options: OptionType<T>[]) {
  return async (state: State<T>) => {
    const { filter } = state;

    if (filter === null) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(filter.toLowerCase())
    );
  };
}

/**
 * A select field in the style of `TgFormField`. By default if a message is
 * sent while the field is expanded a filter will be applied. Paginates results
 * using `TgPagination`.
 *
 * Example:
 * ```typescript
 * this.selectField = this.makeChild('s', TgSelectFormField<number>, {
 *   ctx,
 *   label: 'select',
 *   options: basicFilteredOptions([
 *     { label: 'abc', value: 1 },
 *     { label: 'abc2', value: 2 },
 *     { label: 'abc3', value: 3 },
 *     { label: 'abc4', value: 4 },
 *     { label: 'abc5', value: 5 },
 *     { label: 'abc6', value: 6 },
 *     { label: 'foo1', value: 7 },
 *     { label: 'foo2', value: 8 },
 *   ]),
 * });
 * ```
 */
export class TgSelectFormField<T>
  extends TgComponent<State<T>, Props<T>>
  implements ExpandableComponent
{
  public handlers = {
    onOptionSelect: {
      permanentId: 'o',
      handler: this.onOptionSelect.bind(this),
    },
    onClearSearch: {
      permanentId: 'c',
      handler: this.onClearSearch.bind(this),
    },
    onTextInput: {
      permanentId: 't',
      handler: this.onTextInput.bind(this),
    },
  };

  public field: TgFormField<T>;
  public pagination: TgPagination<OptionType<T>>;

  constructor(
    props: MakeOptional<Props<T>, keyof typeof tgSelectFormFieldDefaultProps>
  ) {
    super({ ...tgSelectFormFieldDefaultProps, ...props });
    const { ctx } = props;

    this.field = this.addChild(
      'f',
      new TgFormField<T>({
        ...props,
        ...this.getEventProps('f'),
        getState: () => this.getState(),
        setState: (state) => this.patchState(state),
      })
    );

    this.field.overrideHandler(this.field.handlers.onTextInput, (...args) =>
      this.handle(this.handlers.onTextInput, ...args)
    );

    this.pagination = this.makeChild('p', TgPagination<OptionType<T>>, {
      ctx,
      paginationPosition: 'top',
      loadPage: async ({ perPage, skip }) => {
        const options = await this.getProperty('options');
        return options.slice(skip, skip + perPage);
      },
      renderPage: renderAsButtonsGrid<OptionType<T>>({
        columns: 2,
        renderElement: (element) => {
          const state = this.getState();

          return {
            button: this.getButton(
              selectedBtnText(element.label, element.value === state.value),
              this.handlers.onOptionSelect,
              element.value
            ),
          };
        },
      }),
      total: async () => {
        const options = await this.getProperty('options');
        return options.length;
      },
      ...this.props.paginationProps,
    });
  }

  isExpanded() {
    return this.field.isExpanded();
  }

  collapse() {
    return this.field.collapse();
  }

  expand() {
    return this.field.expand();
  }

  toggleExpanded() {
    return this.field.toggleExpanded();
  }

  /**
   * Called when an option is selected, updates the filter and closes the
   * field.
   */
  public onOptionSelect(value: T) {
    this.patchState({
      value,
    });
    this.toggleExpanded();
  }

  /**
   * Called when a text message is sent, sets the filter
   */
  public onTextInput(messageCtx: Filter<Context, 'message:text'>) {
    const {
      message: { text },
    } = messageCtx;

    this.patchState({
      filter: text,
    });
    this.pagination.patchState({
      value: 0,
    });
  }

  /**
   * Called when the "clear filter" button is pressed
   */
  public onClearSearch() {
    this.patchState({
      filter: null,
    });
  }

  public async render() {
    const field = await this.field.render();
    const state = this.getState();

    if (state.expanded) {
      const pagination = await this.pagination.render();

      const keyboard = [...field.keyboard];
      if (state.filter !== null) {
        keyboard.push([
          this.getButton(`🔍 ${state.filter} 🗑`, this.handlers.onClearSearch),
        ]);
      }

      keyboard.push(...pagination.keyboard);

      return {
        text: field.text + pagination.text,
        keyboard,
      };
    }

    return field;
  }

  public getDefaultState(): State<T> {
    return {
      p: this.pagination.getDefaultState(),
      ...this.field.getDefaultState(),
      filter: null,
    };
  }
}
