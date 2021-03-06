require! {
  "bus": Bus
  "ui": UI
  "settings": Settings
  "vector2": Vector2
}

class GenWin
  updateInv: 1000 * 15
  _updateInv: null

  show: (@params = {}) -> @win.show!

  hide: -> @win.hide!

  loaderrorCallback: ->

  onloaderror: (cb) -> @loaderrorCallback = cb

  runUpdateTimer: ->
    @stopUpdateTimer!
    @_updateInv = setInterval ~>
      @load (~> @update!), true
    , @updateInv

  stopUpdateTimer: ->
    clearInterval @_updateInv

class NearLinesWin extends GenWin
  ->
    @win = new UI.Menu {
      backgroundColor: \white
      textColor: \black
      highlightBackgroundColor: \black
      highlightTextColor: \white
      sections:
        * title: "加载中..."
          items: []
        ...
    }

    @win.on \select, (e) ~>
      index = e.itemIndex
      @sectionIndex = e.sectionIndex
      @itemIndex = e.itemIndex
      for i til @sectionIndex
        index += @win.state.sections[i].items.length

      if @data? then @selectCallback @data[index]

    @win.on \show, (e) ~>
      @load ~> @update!


  refresh: -> @load ~> @update!

  load: (cb) ->
    (err, lines) <~ Bus.getNearLines
    return @loaderrorCallback err if err

    collectionList = for v, i in Bus.collectionList!
      v.type = "collection"
      v

    @data = collectionList ++ lines
    cb!

  update: ->
    myCollectionItems = []
    nearLineitems = []
    nearLineSectionIndex = 0

    for line, i in @data
      subtitle = ""
      sn = line.sn
      if line.type is "collection"
        myCollectionItems.push {
          title: sn + "路"
          subtitle: "#{line.startSn} -> #{line.endSn}"
        }
      else
        nearLineitems.push {
          title: sn
          subtitle: "距离你 / #{line.distance}米"
        }



    if myCollectionItems.length > 0
      @win.section 0,
        title: "我的收藏"
        items: myCollectionItems
      nearLineSectionIndex = 1
    else
      @win.section 1,
        title: "" items: []
    @win.section nearLineSectionIndex,
      title: "附近站点"
      items: nearLineitems

    if @sectionIndex?
      @win.selection @sectionIndex, @itemIndex



  selectCallback: ->
  onselect: (cb) -> @selectCallback = cb


class StationDetailWin extends GenWin
  ->
    @win = new UI.Menu {
      backgroundColor: \white
      textColor: \black
      highlightBackgroundColor: \black
      highlightTextColor: \white
      sections:
        * title: "加载中..."
          items: []
        ...
    }

    @win.on \select, (e) ~>

      if @data?.lines[e.itemIndex]? then @selectCallback @data.lines[e.itemIndex]

    @win.on \show, (e) ~>
      @load ~> @update!

  load: (cb) ->
    (err, detail) <~ Bus.getStationDetail @params.line
    return @loaderrorCallback err if err
    @data = detail
    cb!

  update: ->

    items = for line, i in @data.lines
      desc = if line.desc then "(#{line.desc})" else ""
      {
        title: "#{line.name}路 #{desc}"
        subtitle: "#{line.startSn} -> #{line.endSn}"
      }

    @win.section 0, {
      title: @params.line.sn
      items
    }

  selectCallback: ->

  onselect: (cb) -> @selectCallback = cb


class BusesDetailWin extends GenWin
  ->
    @win = new UI.Card {
      scrollable: true
      title: "加载中..."
    }

    @win.action "select", \ICON_COLLECTION
    @win.on \show, (e) ~>
      @load ~> @update!
      @runUpdateTimer!

    @win.on \hide, (e) ~>
      @stopUpdateTimer!

    @win.on \click, \select, (e) ~>
      return unless @data?
      @data.hasCollection = !@data.hasCollection
      if @data.hasCollection
        Bus.joinCollection @params.line <<< {
          sn: @data.name
          endSn: @data.endSn
          startSn: @data.startSn
        }
      else
        Bus.removeCollection @params.line.lineId

      @updateCollection!

  load: (cb, isUpdating = false) ->
    unless isUpdating
      (err, detail) <~ Bus.getLineDetail @params.line
      if err
        @stopUpdateTimer!
        return @loaderrorCallback err
      @data = detail <<< hasCollection: !!Bus.hasCollection @params.line.lineId
      cb!
    else if @data
      (err, detail) <~ Bus.updateBusesDetail {} <<< @params.line <<< {flpolicy: @data.flpolicy}
      return @stopUpdateTimer! if err
      @data <<< detail
      cb!

  update: ->

    @win.title "#{@data.name}路"

    @updateCollection!

    subtitleStr = ""

    if @data.desc? and @data.desc.trim! isnt ""
      subtitleStr = @data.depDesc or @data.desc
    else if @data.lastTravelTime isnt -1
      if @data.lastTravelTime < 60
        subtitleStr = "距离到站约#{@data.lastTravelTime}秒"
      else
        lastTravelTime = Math.round @data.lastTravelTime / 60
        subtitleStr = "距离到站约#{lastTravelTime}分钟"

    @win.subtitle subtitleStr
    @win.body """

      #{@data.startSn} -> #{@data.endSn}

      需准备车费: #{@data.price}

      运营时间: #{@data.firstTime} - #{@data.lastTime}
    """

  updateCollection: ->
    title = @win.title!
    @win.title title.replace("\n(已收藏)", "") + if @data.hasCollection then "\n(已收藏)" else ""


class AlertWin extends GenWin
  ->
    @win = new UI.Card {
      scrollable: true
    }
    @win.on \show, (e) ~>
      @update!

  update: ->
    type = @params.type
    if type is 0
      @win.title "提示"
    else if type is 1
      @win.title "警告"
    else if type is 3
      @win.title "错误!!"

    @win.body @params.info


class SplashScreenWin extends GenWin
  ->
    @win = new UI.Card {
      title: "加载中...."
    }
    @win.on \show, ~>
      @load!

  load: ->
    (err) <~ Bus.auth
    return @loaderrorCallback err if err
    @loadsuccessCallback!

  loadsuccessCallback: ->
  onloadsuccess: (cb) -> @loadsuccessCallback = cb


BusUI =
  wins:
    nearLinesWin: new NearLinesWin
    stationDetailWin: new StationDetailWin
    busesDetailWin: new BusesDetailWin
    alertWin: new AlertWin
    splashScreenWin: new SplashScreenWin
  init: ->
    for let i, win of @wins
      win.onloaderror (error) ~>
        win.hide!
        @wins.alertWin.show {
          type: 3
          info: error.message
        }

    loaded = false
    @wins.splashScreenWin.onloadsuccess ~>
      if loaded is true
        console.log "refresh"
        @wins.nearLinesWin.refresh!
      else
        @wins.nearLinesWin.show!
      loaded := true
      @wins.splashScreenWin.hide!
      (line) <~ @wins.nearLinesWin.onselect
      if line.type is \collection
        @wins.busesDetailWin.show line: line
      else
        @wins.stationDetailWin.show line: line
      (line) <~ @wins.stationDetailWin.onselect
      @wins.busesDetailWin.show line: line

    @wins.splashScreenWin.show!


BusUI.init!
