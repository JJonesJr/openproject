import {WorkPackageResourceInterface} from './../../../api/api-v3/hal-resources/work-package-resource.service';
import {RenderInfo, calculatePositionValueForDayCount, timelineElementCssClass} from './../wp-timeline';

const classNameLeftHandle = "leftHandle";
const classNameRightHandle = "rightHandle";

interface CellDateMovement {
  // Target values to move work package to
  startDate?: moment.Moment;
  dueDate?: moment.Moment;
}

export class TimelineCellRenderer {

  public get type():string {
    return 'bar';
  }

  public get fallbackColor():string {
    return '#8CD1E8';
  }

  /**
   * Assign changed dates to the work package.
   * For generic work packages, assigns start and due date.
   *
   */
  public assignDateValues(wp:WorkPackageResourceInterface, dates:CellDateMovement) {
    this.assignDate(wp, 'startDate', dates.startDate);
    this.assignDate(wp, 'dueDate', dates.dueDate);
  }

  /**
   * Restore the original date, if any was set.
   */
  public onCancel(wp:WorkPackageResourceInterface, dates:CellDateMovement) {
    wp.restoreFromPristine('startDate');
    wp.restoreFromPristine('dueDate');
  }

  /**
   * Handle movement by <delta> days of the work package to either (or both) edge(s)
   * depending on which initial date was set.
   */
  public onDaysMoved(wp:WorkPackageResourceInterface, delta:number) {
    const initialStartDate = wp.$pristine['startDate'];
    const initialDueDate = wp.$pristine['dueDate'];
    let dates:CellDateMovement = {};

    if (initialStartDate) {
      dates.startDate = moment(initialStartDate).add(delta, "days");
    }

    if (initialDueDate) {
      dates.dueDate = moment(initialDueDate).add(delta, "days");
    }

    return dates;
  }

  public onMouseDown(ev: MouseEvent, renderInfo:RenderInfo) {
    let dates:CellDateMovement = {};

    // Update the cursor to
    if (jQuery(ev.target).hasClass(classNameLeftHandle)) {
      this.forceCursor('w-resize');
    } else if (jQuery(ev.target).hasClass(classNameRightHandle)) {
      this.forceCursor('e-resize');
    } else {
      this.forceCursor('ew-resize');
    }

    if (!jQuery(ev.target).hasClass(classNameRightHandle)) {
      renderInfo.workPackage.storePristine('startDate');
    }
    if (!jQuery(ev.target).hasClass(classNameLeftHandle)) {
      renderInfo.workPackage.storePristine('dueDate');
    }

    return dates;
  }

  /**
   * Decide whether we need to render anything for the work package.
   */
  public willRender(renderInfo):boolean {
    const wp = renderInfo.workPackage;
    return !!(wp.startDate || wp.dueDate)
  }

  public update(element:HTMLDivElement, wp: WorkPackageResourceInterface, renderInfo:RenderInfo) {
    // abort if no start or due date
    if (!wp.startDate || !wp.dueDate) {
      return;
    }

    // general settings - bar
    element.style.marginLeft = renderInfo.viewParams.scrollOffsetInPx + "px";

    const viewParams = renderInfo.viewParams;
    const start = moment(wp.startDate as any);
    const due = moment(wp.dueDate as any);

    // offset left
    const offsetStart = start.diff(viewParams.dateDisplayStart, "days");
    element.style.left = calculatePositionValueForDayCount(viewParams, offsetStart);

    // duration
    const duration = due.diff(start, "days") + 1;
    element.style.width = calculatePositionValueForDayCount(viewParams, duration);
  }

  /**
   * Render the generic cell element, a bar spanning from
   * start to due date.
   */
  public render(renderInfo:RenderInfo):HTMLDivElement {
    const bar = document.createElement("div");

    bar.className = timelineElementCssClass + " " + this.type;
    bar.style.position = "relative";
    bar.style.height = "1em";
    bar.style.backgroundColor = this.typeColor(renderInfo.workPackage as any);
    bar.style.borderRadius = "2px";
    bar.style.cssFloat = "left";
    bar.style.zIndex = "50";
    bar.style.cursor = "ew-resize";

    const left = document.createElement("div");
    left.className = classNameLeftHandle;
    left.style.position = "absolute";
    left.style.left = "0px";
    left.style.top = "0px";
    left.style.width = "20px";
    left.style.maxWidth = "20%";
    left.style.height = "100%";
    left.style.cursor = "w-resize";
    bar.appendChild(left);

    const right = document.createElement("div");
    right.className = classNameRightHandle;
    right.style.position = "absolute";
    right.style.right = "0px";
    right.style.top = "0px";
    right.style.width = "20px";
    right.style.maxWidth = "20%";
    right.style.height = "100%";
    right.style.cursor = "e-resize";
    bar.appendChild(right)

    return bar;
  }

  protected typeColor(wp: WorkPackageResourceInterface):string {
    let type = wp.type.state.getCurrentValue();
    if (type) {
      return type.color;
    }

    return this.fallbackColor;
  }

  protected assignDate(wp: WorkPackageResourceInterface, attributeName:string, value: moment.Moment) {
    if (value) {
     wp[attributeName] = value.format("YYYY-MM-DD") as any;
    }
  }

  /**
   * Force the cursor to the given cursor type.
   */
  protected forceCursor(cursor:string) {
    jQuery(".hascontextmenu").css("cursor", cursor);
    jQuery("." + timelineElementCssClass).css("cursor", cursor);
  }
}