(function( w ) {
  var PLACEHOLDER = "%d";
  
  var ExPath = function() {
    this._initialize();
    var self = this;
  }
  
  ExPath.prototype = {
    _initialize: function() {
      this._path = "";
      this._is_finished = false;
      this._initModifiers();
    },
    _next: function() {
      if ( this._is_finished ) throw "ExPath is finished. Could not continue with modifying.";
      this._path += ( this._path.length ) ? " " : "";
    },
    _initModifiers: function() {
      var self = this;
      for ( var key in this._modifiers ) {
        if ( !this._modifiers.hasOwnProperty( key ) ) {
          continue;
        }
        (function( k ) {
          self[ k ] = function() {
            var v = self._modifiers[ k ];
            if ( v !== undefined ) {
              self._next();
              
              var dsl = ( typeof( v ) == "string" || v instanceof Array ) ? v : v.dsl,
                  cb = ( typeof( v ) == "object" && typeof( v.cb ) == "function" ) ? v.cb : null,
                  params = Array.prototype.slice.call( arguments ),
                  sub_path = "";
              
              if ( typeof( dsl ) == "string" ) {
                sub_path += dsl;
              } else if ( dsl instanceof Array ) {
                sub_path += dsl[ 0 ];
                dsl = dsl.slice( 1 );
              }
              
              while( params.length ) {
                if ( sub_path.search( PLACEHOLDER ) == -1 ) {
                  if ( ( dsl instanceof Array ) && dsl.length ) {
                    sub_path += dsl[ 0 ];
                    dsl = dsl.slice( 1 );
                  }
                }
                sub_path = sub_path.replace( PLACEHOLDER, params[ 0 ] );
                params = params.slice( 1 );
              }
            }
            
            this._path += sub_path;
            
            if ( typeof( cb ) == "function" ) {
              cb.call( self );
            }
            
            return self;
          }
        })( key );
      }
    },
    _modifiers: {
      "moveTo": "M%d,%d",
      "close": { dsl: "Z", cb: function() { this._is_finished = true } },
      "lineTo": "L%d,%d",
      "hLineTo": "H%d",
      "vLineTo": "V%d",
      "curveTo": "C%d,%d %d,%d %d,%d",
      "sCurveTo": "S%d,%d %d,%d",
      "bCurveTo": "Q%d,%d %d,%d",
      "sbCurveTo": "T%d,%d",
      "arc": "A%d,%d %d %d,%d %d,%d",
      "crCurveTo": [ "R%d,%d", " %d,%d" ]
    },

    getPathDSL: function() {
      return this._path;
    },
    isFinished: function() {
      return _is_finished;
    },
    isStarted: function() {
      return !( this._path == "" )
    }
  }
  
  w.ExPath = ExPath;
})(window)