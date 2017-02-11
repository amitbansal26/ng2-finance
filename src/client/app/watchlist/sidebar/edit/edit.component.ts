import { Component, Renderer, OnDestroy, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { DragulaService } from 'ng2-dragula';
import { Config, Subscriptions } from '../../../core/index';
import { SidebarStateService, SidebarTypeEnum } from '../state/index';
import { FavoritesStateService } from '../favorites/state/index';
import { HeaderStateService } from '../../../shared/header/state/header-state.service';
import { WatchlistStateService } from '../../state/watchlist-state.service';
import { StockDataInterface } from '../../state/watchlist.state';

@Component({
  moduleId: module.id,
  selector: 'mp-edit',
  templateUrl: 'edit.component.html',
  styleUrls: ['edit.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class EditComponent extends Subscriptions implements OnDestroy {
  @ViewChild('list') list:ElementRef;
  favoritesData:StockDataInterface[] = [];
  notification:string;
  selected:string;
  deleted:string[] = [];
  dragName:string = 'editDrag';
  private windowClickListener: Function;
  private favorites:string[] = [];

  constructor(private favoritesState:FavoritesStateService,
              private sidebarState:SidebarStateService,
              private headerState:HeaderStateService,
              private watchlistState:WatchlistStateService,
              private renderer:Renderer,
              private dragulaService: DragulaService) {
    super();
    this.subscriptions.push(watchlistState.favorites$.subscribe(
      favorites => this.favorites = favorites
    ));

    this.subscriptions.push(favoritesState.data$.subscribe(
      data => this.favoritesData = data.filter((item:StockDataInterface) => {
        return this.favorites.indexOf(item.symbol) !== -1;
      })
    ));

    dragulaService.setOptions(this.dragName, {
      moves: function (el:Element, container:Element, handle:Element) {
        return handle.className.indexOf('mp-drag') !== -1;
      }
    });
  }

  showDelete(symbol:string, event:Event) {
    event.stopPropagation();
    this.selected = symbol;
    this.windowClickListener = this.renderer.listenGlobal('window', 'click',
      (event:Event) => {
        this.selected = null;
        this.destroyListener();
      });
  }

  close() {
    this.closeScreen(SidebarTypeEnum.List);
  }

  add() {
    this.closeScreen(SidebarTypeEnum.Add);
  }

  delete(symbol:string, event:Event) {
    event.stopPropagation();
    this.deleted.push(symbol);
    if (this.deleted.length === this.favoritesData.length) {
      this.notification = Config.notifications.noFavorites;
    }
    this.destroyListener();
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.destroyListener();
    this.dragulaService.destroy(this.dragName);
  }

  private destroyListener() {
    if(this.windowClickListener) {
      this.windowClickListener();
      this.windowClickListener = null;
    }
  }

  private closeScreen(type:SidebarTypeEnum) {
    this.favoritesState.changeOrder(this.updateOrder(this.list.nativeElement, this.deleted));

    if (this.deleted.length > 0) {
      this.watchlistState.deleteFavorites(this.deleted);
    }

    if (type === SidebarTypeEnum.Add) {
      this.headerState.changeSearchActive(true);
    } else {
      this.sidebarState.changeType(type);
    }
  }

  private updateOrder(list:Element, deleted:string[]):string[] {
    let order:string[] = [];
    if (list) {
      let children:any = list.getElementsByTagName('li');
      for (let i:number = 0; i < children.length; i++) {
        if (deleted.indexOf(children[i].id) === -1) {
          order.push(children[i].id);
        }
      }
      children = null;
    }
    return order;
  }
}
