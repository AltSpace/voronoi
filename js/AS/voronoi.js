;( function( W ) {
  
  W.is_empty = function( v ) {
    return v === undefined || v === null;
  }
  
  var Voronoi = new Class({
    
    Implements: [ Options, Events ],
    
    options: {
      paper: 'paper',
      items: [],
      cursor: {
        height: 120,
        error: 5
      },
      viewbox: {
        min_size: { w: 1000, h: 600 }
      },
      attrs: {
        path: { fill: "#000", stroke: "#000", "stroke-width": 15 },
        text: { fill: "#FFF", "font-size": 16 },
        title: { fill: "#C0C0C0", "font-size": 14 }
      }
    },
    
    initialize: function( options ) {
      var self = this;
      this.voronoi = new VVoronoi();
      this.setOptions( options );
      this.addEvent( 'paper.ready', function() {
        self._loadTemplates();
        self.last_mouse_pos = { x: self.paper.width / 2, y: self.paper.height / 2 };
        self._generateSites();
        self._bindMouse();
        self._bindResize();
        self.draw();
        self._fixBGTransforms();
      } );
      this.addEvent( 'paper.resized', function() {
        self.closest_site = self._getClosestSite( self.last_mouse_pos );
        self.sites = self._generateBeeHivePoints( this._getDim(), true );
        self.draw();
        self._fixBGTransforms();
      } );
      this._initPaper();
    },
    
    _bindResize: function() {
      var self = this;
      W.addEvent( 'resize', function() {
        self.resize();
      } );
    },
    
    _bindMouse: function() {
      var self = this;
      W.addEvent( 'mousemove', function( e ) {
        var x = e.event.x || e.event.clientX,
            y = e.event.y || e.event.clientY;
        self.last_mouse_pos = { x: x, y: y };
        self.closest_site = self._getClosestSite.call( self, self.last_mouse_pos );
        self._redrawCursorPath( self.last_mouse_pos );
      } );
    },
    
    _initPaper: function() {
      var self = this;
      Raphael( this.options.paper, W.innerWidth, W.innerHeight, function() {
        self.paper = this;
        self.fireEvent( 'paper.ready', self.paper );
      } )
    },
    
    resize: function() {
      var w = W.innerWidth,
          h = W.innerHeight,
          o = this.options.viewbox;
      
      w = ( w < o.min_size.w ) ? o.min_size.w : w;
      h = ( h < o.min_size.h ) ? o.min_size.h : h;
      this.paper.setSize( w, h );
      this.fireEvent( 'paper.resized', w, h );
    },
    
    _generateSites: function() {
      this.paths = [];
      this.sites = this._generateBeeHivePoints( this._getDim(), true );
    },
    
    _getDim: function() {
      var cols = this.options.viewbox.cols || 0,
          rows = this.options.viewbox.cols || 0;
      if ( cols === undefined && rows === undefined ) {
        
      } else if ( rows === undefined ) {
        rows = Math.ceil( this.options.items.length / cols );
      } else if ( cols === undefined ) {
        cols = Math.ceil( this.options.items.length / rows );
      }
      
      if ( !cols || !rows ) {
        console.error( "You should provide cols or|and rows value in viewbox options." );
      }
      
      return { rows: rows, cols: cols };
    },
    
    _generateBeeHivePoints: function( size, loose ) {
      var points = [];
    	var col = {
    	  x: this.paper.width / size.cols,
    	  y: this.paper.height / size.rows
    	};
    	for( var i = -1; i < size.cols + 1; i++ ) {
    		for( var j = -1; j < size.rows + 1; j++ ) {
    			var point = {
    			  x: ( i / size.cols * this.paper.width + col.x / 2 ),
    			  y: ( j / size.rows * this.paper.height + col.y / 2 )
    			}
    			if ( j % 2 ) {
    				point.x += col.x / 2;
    			}
    			if ( loose ) {
    				point.x += col.x / 4 * ( Math.random() - 1 );
    				point.y += col.y / 4 * ( Math.random() - 1 );
    			}
    			points.push( point );
    		}
    	}
    	
    	return points;
    },
    	
  	_getClosestSite: function( cursor_pos ) {
      var closest_distance,
          closest_site;
      // определение ближайшей к курсору мышки ячейки
      for ( var i = 0; i < this.sites.length; i++ ) {
  	    var site = this.sites[ i ];
  	    if (
  	      !is_empty( cursor_pos ) &&
  	      !is_empty( site.path ) &&
          site.x > this.paper._left &&
          site.x < this.paper._left + this.paper.width &&
          site.y > this.paper._top &&
          site.y < this.paper._top + this.paper.height
        ) {
          var pointer_distance = Math.pow( cursor_pos.x - site.x, 2 ) +
                                 Math.pow( cursor_pos.y - site.y, 2 );
          if ( undefined === closest_distance ||
                pointer_distance < closest_distance ) {
            closest_distance = pointer_distance;
            closest_site = site;
          }
        }
  	  }

  	  return closest_site;
    },
    
    getBBox: function() {
      return {
    		xl: 0,
    		xr: this.paper.width,
    		yt: 0,
    		yb: this.paper.height
    	};
    },
    
    draw: function() {
      
      var bbox = this.getBBox(),
          diagram = this.voronoi.compute( this.sites, bbox );
          
    	if (diagram) {
    	  var current_ids = [],
    	      last_path,
    	      index = 1;
    	  
    	  for ( var i = 0, l = this.sites.length; i < l; i++ ) {
          var cell = diagram.cells[ this.sites[ i ].voronoiId ],
              ix = current_ids.indexOf( this.sites[ i ].voronoiId );
          if ( ix !== -1 ) {
            current_ids.splice( ix, 1 );
          }
          
          if ( cell ) {
            var halfedges = cell.halfedges,
                fill_template = "",
                site = this.sites[ i ];
            var length = halfedges.length
                
            if ( length > 2 ) {
              var points = [];
              for (var j = 0; j < length; j++) {
                v = halfedges[ j ].getEndpoint();
                points.push( v );
              }
              
              if (
                !is_empty( this.options.items[ index - 1 ] ) &&
                site.x > this.paper._left &&
                site.x < this.paper._left + this.paper.width &&
                site.y > this.paper._top &&
                site.y < this.paper._top + this.paper.height
              ) {
                var item_opts = this.options.items[ index - 1 ];
                    fill_template = item_opts.bg,
                    path = this._setPath( points, this.sites[i], this.paths[ i ], "url(#" + fill_template + ")" );
                
                path.attr( 'href', item_opts.href );
                
                this.paths[ i ] = path;
                site.path = path;
                site.points = points;
                site.title = item_opts.title;
                site.signature = item_opts.descr;
                site.fill_template = fill_template;
                site.href = item_opts.href;
                index++;
              }
            }
          }
        }
        
        this.closest_site = this._getClosestSite( this.last_mouse_pos );
        this._redrawCursorPath( this.last_mouse_pos );
      }
    },
    
    _fixBGTransforms: function() {
      for ( var i = 0, l = this.sites.length; i < l; i++ ) {
        var site = this.sites[ i ],
            path = site.path;
        if ( !is_empty( path ) ) {
          var bbox = path.getBBox( 1 ),
              pattern = path.pattern;
          this._$( pattern, { patternTransform: "matrix(1,0,0,1,0,0) translate(" + bbox.x + "," + bbox.y + ")" } );
        }
      }
    },
    
    _sortPoints: function( points, relate_to ) {
      // просчитываем углы для каждой точки
      // относительно центра зоны
      // сортируем по углу наклона
      var polars = [],
          res = [],
          self = this;
      points.each( function( point ) {
        var vector = { x: relate_to.x - point.x, y: relate_to.y - point.y };
        angle = self._decartToAngle( vector );
        polars.push( { angle: angle, point: point } );
      } );
      
      polars.sort( function( p1, p2 ) { return p1.angle - p2.angle } );
      
      polars.each( function( polar ) {
        res.push( polar.point );
      } );
      
      return res;
    },
    
    _decartToAngle: function( vector ) {
      var x = vector.x,
          y = vector.y,
          pi = Math.PI;
      if ( x == 0 ) {
        return ( y > 0 ) ? pi / 2 : -1 * pi / 2;
      }
      var atg = Math.atan( y / x );
      atg += ( x > 0 ) ? ( ( y > 0 ) ? 0 : 2 * pi ) : pi;
      
      return atg;
    },
    
    _redrawCursorPath: function( mouse_pos ) {
      
      if ( is_empty( this.closest_site ) ) {
        this.closest_site = this._getClosestSite( mouse_pos );
      }
      
      var closest_path = this.closest_site.path.attr( 'path' ),
          self = this;
      
      if ( is_empty( closest_path ) ) {
        return;
      }
      
      if ( is_empty( this.cursor_path ) ) {
        this.cursor_path = this.paper.path();
        this.cursor_path.attr( this.options.attrs.path );
      }
      
      if ( is_empty( this.cursor_path_text ) ) {
        this.cursor_path_text = this.paper.text( 0, 0, "" ).attr( this.options.attrs.text );
      }
      
      if ( is_empty( this.cursor_path_title ) ) {
        this.cursor_path_title = this.paper.text( 0, 0, "" ).attr( this.options.attrs.title );
      }
      
      var left_x = this.paper._left,
          right_x = this.paper._left + this.paper.width,
          y = mouse_pos.y,
          top_y = y - this.options.cursor.height / 2,
          bottom_y = y + this.options.cursor.height / 2;
      
      var top_line_path = (new ExPath()).moveTo( left_x, top_y ).lineTo( right_x, top_y ).getPathDSL(),
          bottom_line_path = (new ExPath()).moveTo( left_x, bottom_y ).lineTo( right_x, bottom_y ).getPathDSL(),
          top_intersections = Raphael.pathIntersection(
            top_line_path,
            closest_path
          ),
          bottom_intersections = Raphael.pathIntersection(
            bottom_line_path,
            closest_path
          );
      
      // counter clockwise iterator
      var point_set = [],
          point_set_external = this.closest_site.points;
          
      
      this.closest_site.points.each( function( point ) {
        if ( ( point.y >= top_y - self.options.cursor.error || !top_intersections.length ) &&
          ( point.y <= bottom_y + self.options.cursor.error || !bottom_intersections.length ) ) {
          point_set.push( { x: point.x, y: point.y } );
        }
      } );
      
      point_set = point_set.concat( top_intersections ).concat( bottom_intersections );
      
      point_set_external = point_set_external.concat( top_intersections ).concat( bottom_intersections );
      
      var cursor_expath = new ExPath();
      
      if ( is_empty( this.top_sub_path ) ) {
        this.top_sub_path = this.paper.path().attr( this.options.attrs.path );
      }
      if ( is_empty( this.bottom_sub_path ) ) {
        this.bottom_sub_path = this.paper.path().attr( this.options.attrs.path );
      }
      
      var top_path_points = [],
          bottom_path_points = [];
      
      point_set_external.each( function( point ) {
        if ( point.y <= top_y + self.options.cursor.error ) {
          top_path_points.push( { x: point.x, y: point.y } );
        } else if ( point.y >= bottom_y - self.options.cursor.error ) {
          bottom_path_points.push( { x: point.x, y: point.y } );
        }
      } );
      
      var top_path_bbox, bottom_path_bbox,
          top_path_dsl = "", bottom_path_dsl = "";
      
      
      if ( top_path_points.length > 2 )
        top_path_bbox = Raphael.pathBBox( ExPath.Util.roundabout( top_path_points ).getPathDSL() );
      if ( bottom_path_points.length > 2 )
        bottom_path_bbox = Raphael.pathBBox( ExPath.Util.roundabout( bottom_path_points ).getPathDSL() );
      
      if ( ( top_path_points.length > 2 ) && !is_empty( top_path_bbox ) ) {
        top_path_points = this._rejectShortDist( this._sortPoints(
          top_path_points,
          { x: top_path_bbox.x + top_path_bbox.width / 2, y: top_path_bbox.y + top_path_bbox.height / 2 }
        ), 2 );
        top_path_dsl = ExPath.Util.roundaboutMiddle( top_path_points ).getPathDSL();
      }
      this.top_sub_path.attr( { path: top_path_dsl, fill: "url(#" + this.closest_site.fill_template + ")" } ).toFront();
      
      if ( ( bottom_path_points.length > 2 ) && !is_empty( bottom_path_bbox ) ) {
        bottom_path_points = this._rejectShortDist( this._sortPoints(
          bottom_path_points,
          { x: bottom_path_bbox.x + bottom_path_bbox.width / 2, y: bottom_path_bbox.y + bottom_path_bbox.height / 2 }
        ), 2 );
        bottom_path_dsl = ExPath.Util.roundaboutMiddle( bottom_path_points ).getPathDSL();
      }
      
      this.bottom_sub_path.attr( { path: bottom_path_dsl, fill: "url(#" + this.closest_site.fill_template + ")" } ).toFront();
      
      point_set = this._rejectShortDist( this._sortPoints( point_set, { x: this.closest_site.x, y: this.closest_site.y } ), 5 );
      
      point_set.each( function( point ) {
        if ( !cursor_expath.isStarted() ) {
          cursor_expath.moveTo(
            Math.round( point.x ),
            Math.round( point.y )
          );
        } else {
          cursor_expath.lineTo(
            Math.round( point.x ),
            Math.round( point.y )
          );
        }
      } );
      cursor_expath.close();
      
      this.cursor_path.attr( { path: this.closest_site.path.attr( "path" ) } );
      
      var signature,
          title,
          pos,
          bbox;
      if ( !is_empty( this.closest_site.signature ) ) {
        title = this.closest_site.title;
        signature = this.closest_site.signature;
        bbox = Raphael.pathBBox( cursor_expath.getPathDSL() );
        pos = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
      } else {
        title = "";
        signature = "";
        pos = { x: 0, y: 0 };
      }
      
      this.cursor_path_text.attr( { text: signature, x: pos.x, y: pos.y + 15 } ).toFront();
      this.cursor_path_title.attr( { text: title, x: pos.x, y: pos.y - 15 } ).toFront();
      
      [ this.cursor_path_text, this.cursor_path_title, this.cursor_path ].each( function( el ) {
        el.attr( 'href', self.closest_site.href );
      } )
      
    },
    
    _addPattern: function( img_src, id ) {
      var self = this,
          canvas = this.paper.canvas,
          doc = canvas.ownerDocument,
          namespaceUri = canvas.namespaceURI,
          defs = this.paper.defs,
          el = this._$("pattern"),
          ig = this._$("image");
          el.id = id;
          this._$( el, { x: 0, y: 0, patternUnits: "userSpaceOnUse", height: 1, width: 1 } );
          this._$( ig, { x: 0, y: 0, "xlink:href": img_src } );
          el.appendChild( ig );
      
      ( function ( el ) {
        Raphael._preload( img_src, function () {
          var w = this.offsetWidth,
              h = this.offsetHeight;
          self._$( el, { width: w, height: h } );
          self._$( ig, { width: w, height: h } );
        } );
      } )( el );
      
      defs.appendChild( el );
      
      return el.id;
    },
    
    _$: function ( el, attr ) {
      var xlink = "http://www.w3.org/1999/xlink";
      if (attr) {
        if (typeof el == "string") {
          el = this._$(el);
        }
        for ( var key in attr ) if (attr.hasOwnProperty( key ) ) {
          if ( key.substring( 0, 6 ) == "xlink:" ) {
            el.setAttributeNS( xlink, key.substring( 6 ), String( attr[ key ] ) );
          } else {
            el.setAttribute( key, String( attr[ key ] ) );
          }
        }
      } else {
        el = Raphael._g.doc.createElementNS( "http://www.w3.org/2000/svg", el );
        el.style && ( el.style.webkitTapHighlightColor = "rgba(0,0,0,0)" );
      }
      return el;
    },
    
    _rejectShortDist: function( sorted_points, min_dist ) {
      var res = [],
          prev_point,
          sqMinDist = Math.pow( min_dist, 2 ),
          self = this;
      
      sorted_points.each( function( point ) {
        if ( !is_empty( prev_point ) ) {
          if ( sqMinDist <= self._sqDistanceBetween( point, prev_point ) ) {
            res.push( point );
          }
        } else {
          res.push( point );
        }
        prev_point = point;
      } );
      
      return res;
    },
    
    _sqDistanceBetween: function( p1, p2 ) {
      return Math.pow( p1.x - p2.x, 2 ) + Math.pow( p1.y - p2.y, 2 );
    },
    
    _setPath: function( points, site, current_path, fill_template ) {
    	var path,
    	    ex_p = ExPath.Util.roundaboutMiddle( points ),
          path_dsl;
      
      if ( is_empty( ex_p ) ) {
        return;
      }
      
      path_dsl = ex_p.getPathDSL();
      
      if ( current_path !== undefined && current_path !== null ) {
        path = current_path;
        path.animate( { path: path_dsl }, 600, "<>", function() {} );
      } else {
        path =this.paper.path( path_dsl ).attr( this.options.attrs.path );
        path.attr( "fill", fill_template );
      }
      
      return path;
    },
    
    _loadTemplates: function() {
      var items = this.options.items;
      for ( var i = 0, l = items.length; i < l; i++ ) {
        if ( items[ i ].bg ) {
          var tmpl_name = "template_" + i;
          this._addPattern( items[ i ].bg, tmpl_name );
          items[ i ].bg = tmpl_name;
        }
      }
    }
    
  });
  
  Voronoi.bang = function( options ) {
    new Voronoi( options );
  }
  
  W.AS = W.AS || {};
  
  W.AS.Voronoi = Voronoi;
  
} )( window );