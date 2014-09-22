/*global window:false, setTimeout:true, console:true */

(function(context) {
    'use strict';

    var win = context, doc = win.document;

    var global_instance_name = 'cbinstance';

    /*!
     * contentloaded.js
     *
     * Author: Diego Perini (diego.perini at gmail.com)
     * Summary: cross-browser wrapper for DOMContentLoaded
     * Updated: 20101020
     * License: MIT
     * Version: 1.2
     *
     * URL:
     * http://javascript.nwbox.com/ContentLoaded/
     * http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
     *
     */
    // @win window reference
    // @fn function reference
    function contentLoaded(win, fn) {
        var done = false, top = true,
        doc = win.document, root = doc.documentElement,

        add = doc.addEventListener ? 'addEventListener' : 'attachEvent',
        rem = doc.addEventListener ? 'removeEventListener' : 'detachEvent',
        pre = doc.addEventListener ? '' : 'on',

        init = function(e) {
            if (e.type == 'readystatechange' && doc.readyState != 'complete') return;
            (e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
            if (!done && (done = true)) fn.call(win, e.type || e);
        },

        poll = function() {
            try { root.doScroll('left'); } catch(e) { setTimeout(poll, 50); return; }
            init('poll');
        };

        if (doc.readyState == 'complete') fn.call(win, 'lazy');
        else {
            if (doc.createEventObject && root.doScroll) {
                try { top = !win.frameElement; } catch(e) { }
                if (top) poll();
            }
            doc[add](pre + 'DOMContentLoaded', init, false);
            doc[add](pre + 'readystatechange', init, false);
            win[add](pre + 'load', init, false);
        }
    }

    var Cookies = {
            get: function (key) {
                return decodeURIComponent(doc.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
            },
            set: function (key, val, end, path, domain, secure) {
                if (!key || /^(?:expires|max\-age|path|domain|secure)$/i.test(key)) {
                    return false;
                }
                var expires = '';
                if (end) {
                    switch (end.constructor) {
                        case Number:
                            expires = end === Infinity ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT' : '; max-age=' + end;
                            break;
                        case String:
                            expires = '; expires=' + end;
                        break;
                        case Date:
                            expires = '; expires=' + end.toUTCString();
                        break;
                    }
                }
                doc.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(val) + expires + (domain ? '; domain=' + domain : '') + (path ? '; path=' + path : '') + (secure ? '; secure' : '');
                return true;
            },
            has: function (key) {
                return (new RegExp('(?:^|;\\s*)' + encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=')).test(doc.cookie);
            },
            remove: function (key, path, domain) {
                if (!key || !this.has(key)) { return false; }
                doc.cookie = encodeURIComponent(key) + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + ( domain ? '; domain=' + domain : '') + ( path ? '; path=' + path : '');
                return true;
            }
        },
        Utils = {
            on: function(el, ev, fn) {
                var add = el.addEventListener ? 'addEventListener' : 'attachEvent',
                    pre = el.addEventListener ? '' : 'on';
                el[add](pre + ev, fn, false);
            },

            // merge objects and whatnot
            merge: function(){
                var obj = {},
                    i = 0,
                    al = arguments.length,
                    key;
                if (0 === al) {
                    return obj;
                }
                for (; i < al; i++) {
                    for (key in arguments[i]) {
                        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
                            obj[key] = arguments[i][key];
                        }
                    }
                }
                return obj;
            },

            str2bool: function(str) {
                str = '' + str;
                switch (str.toLowerCase()) {
                    case 'false':
                    case 'no':
                    case '0':
                    case '':
                        return false;
                    default:
                        return true;
                    }
            },

            fade_in: function(el) {
                if (el.style.opacity < 1) {
                    el.style.opacity = (parseFloat(el.style.opacity) + 0.05).toFixed(2);
                    win.setTimeout(function(){
                        Utils.fade_in(el);
                    }, 50);
                }
            },

            get_data_attribs: function(script) {
                var data = {};
                if (Object.prototype.hasOwnProperty.call(script, 'dataset')) {
                    data = script.dataset;
                } else {
                    var attribs = script.attributes;
                    var key;
                    for (key in attribs) {
                        if (Object.prototype.hasOwnProperty.call(attribs, key)) {
                            var attr = attribs[key];
                            if (/^data-/.test(attr.name)) {
                                var camelized = Utils.camelize(attr.name.substr(5));
                                data[camelized] = attr.value;
                            }
                        }
                    }
                }
                return data;
            },

            /**
            * "Standardizes" the options keys by converting and removing
            * any potential "dashed-property-name" into "dashedPropertyName".
            * In case both are present, the dashedPropertyName wins.
            */
            normalize_keys: function(options_object) {
                var camelized = {};
                for (var key in options_object) {
                    if (Object.prototype.hasOwnProperty.call(options_object, key)) {
                        var camelized_key = Utils.camelize(key);
                        // TODO: could this break for "falsy" values within options_object?
                        // avoiding "dashed-property-name" overriding a potentially existing "dashedPropertyName"
                        camelized[camelized_key] = options_object[camelized_key] ? options_object[camelized_key] : options_object[key];
                    }
                }
                return camelized;
            },

            camelize: function(str) {
                var separator = '-',
                    match = str.indexOf(separator);
                while (match != -1) {
                    var last = (match === (str.length - 1)),
                        next = last ? '' : str[match + 1],
                        upnext = next.toUpperCase(),
                        sep_substr =  last ? separator : separator + next;
                    str = str.replace(sep_substr, upnext);
                    match = str.indexOf(separator);
                }
                return str;
            },

            find_script_by_id: function(id) {
                var scripts = doc.getElementsByTagName('script');
                for (var i = 0, l = scripts.length; i < l; i++) {
                    if (id === scripts[i].id) {
                        return scripts[i];
                    }
                }
                return null;
            }

        },
        script_el_invoker = Utils.find_script_by_id('cookiebanner'),
        Cookiebanner = function(opts) {
        this.init(opts);
    };

    Cookiebanner.prototype = {
        options : {},

        inputs : [],

        // for testing stuff from the outside mostly
        cookiejar: Cookies,

        allowed       : 0,
        allowedBinary : '000',
        askBinary     : '000',

        info : null,
        configure : null,
        pipe : null,

        questions : [],

        currentQuestion : -1,

        agreeValue : {
            'audience' : 1,
            'social'   : 2,
            'pub'      : 4
        },

        agreeMask : {
            'audience' : '..1',
            'social'   : '.1.',
            'pub'      : '1..'
        },

        add: function(name){
            this.allowed += this.agreeValue[name];
            this.save();
        },

        set: function(value){
            this.allowed = value;
            this.save();
        },

        save: function(){
            this.setCookie(this.allowed);
        },

        decodeAllowed : function(code) {
            var b = '000' + parseInt(code).toString(2);
            return b.substr(-3);
        },

        isAllowed : function(name, code) {
            var reg;

            if (!(name in this.agreeMask)) {
                return false;
            }

            reg = new RegExp(this.agreeMask[name]);

            return reg.test(code);
        },

        askForm: function(name, visible){
            var self = this,
                wrap = doc.createElement('span'),
                q = doc.createTextNode(this.options[name]),
                labelYes = doc.createElement('label'),
                labelNo = doc.createElement('label'),
                inputYes = doc.createElement('input'),
                inputNo  = doc.createElement('input'),
                yes = doc.createTextNode(this.options.yes),
                no = doc.createTextNode(this.options.no);

            this.inputs.push(inputYes);
            this.inputs.push(inputNo);

            inputYes.type = inputNo.type  = 'radio';
            inputYes.name = inputNo.name  = 'cookiebanner-' + name;

            Utils.on(inputYes, 'change', function(){
                self.nextQuestion();
                self.add(name);
            });
            Utils.on(inputNo, 'change', function(){
                self.nextQuestion();
                self.save();
            });

            labelYes.appendChild(inputYes);
            labelYes.appendChild(yes);
            labelNo.appendChild(inputNo);
            labelNo.appendChild(no);

            if (!visible) {
                wrap.style.display = 'none';
            }
            wrap.appendChild(q);
            wrap.appendChild(labelYes);
            wrap.appendChild(labelNo);

            this.questions.push(wrap);

            return wrap;
        },

        nextQuestion : function(){

            for (var ii = 0; ii < this.inputs.length; ii++) {
                this.inputs[ii].checked = false;
            }

            if (this.currentQuestion > -1) {
               this.questions[this.currentQuestion].style.display = 'none';
            } else {
              this.info.style.display = 'none';
              this.configure.style.display = 'none';
              this.pipe.style.display = 'none';
            }
            this.currentQuestion++;
            if (this.questions.length > this.currentQuestion) {
                this.questions[this.currentQuestion].style.display = 'inline';
            } else {
                this.info.style.display = 'inline';
                this.configure.style.display = 'inline';
                this.pipe.style.display = 'inline';
                this.currentQuestion = -1;
            }
        },

        visit: function() {
            /*
             * On dépose un cookie pour la première visite valable 5 min
             */
            this.cookiejar.set(this.options.cookie, -1, 300, this.options.cookiePath);
            return true;
        },

        visited: function(){
            return this.hasCookie()
                && this.getCookie() == -1
                && document.location.href != this.options.moreinfo;
        },

        agree: function() {
            this.set(7);
            return true;
        },

        agreed: function(){
            return this.getCookie() > -1;
        },

        hasCookie: function(){
            return this.cookiejar.has(this.options.cookie);
        },

        getCookie: function(){
            return parseInt(this.cookiejar.get(this.options.cookie));
        },

        setCookie: function(value){
            this.cookiejar.set(this.options.cookie, value, this.options.expires, this.options.cookiePath);
            return true;
        },

        removeCookie: function(value){
            this.cookiejar.remove(this.options.cookie, this.options.cookiePath);
            return true;
        },

        init: function(opts) {
            this.inserted = false;
            this.closed = false;
            this.test_mode = false; // TODO: implement

            /*
             * Default text
             */
            var default_audience = 'Acceptez-vous d\'être suivi par notre outils de mesure d\'audience';
            var default_social = 'Acceptez-vous d\'être suivi par notre outils de partage sur les réseaux sociaux';
            var default_pub = 'Acceptez-vous d\'être suivi par notre outils de publicité';
            var default_text = 'Nous utilisons des cookies pour améliorer votre expérience. ' +
                'En poursuivant votre navigation sur ce site, vous acceptez notre utilisation des cookies.';
            var default_link = 'En savoir plus';

            this.default_options = {
                // autorun: true,
                cookie: 'cookiebanner-accepted',
                closeText: '&#10006;',
                cookiePath: '/',
                debug: false,
                expires: function(){
                    var x = 13,
                        CurrentDate = new Date();
                    CurrentDate.setMonth(CurrentDate.getMonth() + x);
                    return CurrentDate;
                },
                zindex: 255,
                mask: false,
                maskOpacity: 0.5,
                maskBackground: '#000',
                height: 'auto',
                minHeight: '21px',
                bg: '#000',
                fg: '#ddd',
                link: '#aaa',
                position: 'bottom',
                message: default_text,
                linkmsg: default_link,
                moreinfo: 'http://aboutcookies.org',

                /*
                 * Valeur pour savoir quelles permissions demandées
                 * 1 : audience
                 * 2 : social
                 * 4 : publicité
                 *
                 * on additionne les permissions a demander, donc 0 pour aucune
                 * demande et 7 pour toutes
                 */
                configure : 'Paramétrer',
                ask: '0',
                audience: default_audience,
                social: default_social,
                pub: default_pub,
                yes: 'Oui',
                no: 'Non',

                effect: null,
                fontSize: '14px',
                fontFamily: 'arial, sans-serif',
                instance: global_instance_name
            };

            this.options = this.default_options;
            this.script_el = script_el_invoker;

            if (this.script_el) {
                var data_options = Utils.get_data_attribs(this.script_el);
                this.options = Utils.merge(this.options, data_options);
            }

            // allowing opts passed to the ctor to override everything
            if (opts) {
                // mimics the "data-option-name" HTML attribute becoming
                // this.options.optionName
                opts = Utils.normalize_keys(opts);
                this.options = Utils.merge(this.options, opts);
            }

            // allows customizing the global instance name via options too
            global_instance_name = this.options.instance;

            // TODO: parse/validate other options that can benefit
            this.options.zindex = parseInt(this.options.zindex, 10);
            this.options.mask = Utils.str2bool(this.options.mask);

            // check for a possible global callback specified as a string
            if ('string' === typeof this.options.expires) {
                if ('function' === typeof context[this.options.expires]) {
                    this.options.expires = context[this.options.expires];
                }
            }

            // check if expires is a callback
            if ('function' === typeof this.options.expires) {
                // TODO: this might not always be as simple as this
                this.options.expires = this.options.expires();
            }

            // Proceed with our plans only if we're invoked via a <script> element
            // that has the required id attribute.
            // For manually created instances one must call run() explicitly.
            if (this.script_el) {
                this.run();
            }
        },

        log: function(){
            if ('undefined' !== typeof console) {
                console.log.apply(console, arguments);
            }
        },

        run: function() {
            var self = this;

            if (!this.agreed() || document.location.href == this.options.moreinfo) {
                var self = this;
                contentLoaded(win, function(){
                    self.insert();
                });
            }

            this.askBinary = this.decodeAllowed(this.options.ask);
            if (this.hasCookie() && this.getCookie() > -1) {
                this.allowed = this.getCookie();
            } else {
                this.allowed = 0;
            }
            this.allowedBinary = this.decodeAllowed(this.allowed);

            context.Cookiebanner = {
                isAllowed : function(name) {
                    return self.isAllowed(name, self.allowedBinary);
                },
                reset : function(name) {
                    return self.removeCookie();
                }
            }
        },

        build_viewport_mask: function() {
            var mask = null;
            if (true === this.options.mask) {
                var mask_opacity = this.options.maskOpacity;
                var bg = this.options.maskBackground;
                var mask_markup = '<div id="cookiebanner-mask" style="' +
                    'position:fixed;top:0;left:0;width:100%;height:100%;' +
                    'background:' + bg + ';zoom:1;filter:alpha(opacity=' +
                    (mask_opacity * 100) +');opacity:' + mask_opacity +';' +
                    'z-index:' + this.options.zindex +';"></div>';
                var el = doc.createElement('div');
                el.innerHTML = mask_markup;
                mask = el.firstChild;
            }
            return mask;
        },

        close: function() {
            if (this.inserted) {
                if (!this.closed) {
                    if (this.element) {
                        doc.body.removeChild(this.element);
                    }
                    if (this.element_mask) {
                        doc.body.removeChild(this.element_mask);
                    }
                    this.closed = true;
                }
            }/* else {
                throw new Error("Not inserted but closing?!");
            }*/
            return this.closed;
        },

        agree_and_close:function() {
            this.agree();
            return this.close();
        },

        // close and remove every trace of ourselves completely
        cleanup: function() {
            this.close();
            return this.unload();
        },

        unload: function() {
            if (this.script_el) {
                this.script_el.parentNode.removeChild(this.script_el);
            }
            context[global_instance_name] = undefined;
            // delete context[global_instance_name];
            return true;
        },

        insert: function() {
            var self = this, zidx, el, el_a, el_x;

            this.element_mask = this.build_viewport_mask();

            zidx = this.options.zindex;

            if (this.element_mask) {
                // bump notice element's zindex so it's above the mask
                zidx += 1;
            }

            el = doc.createElement('div');
            el.className = 'cookiebanner';
            el.style.position = 'fixed';
            el.style.left = 0;
            el.style.right = 0;
            el.style.height = this.options.height;
            el.style.minHeight = this.options.minHeight;
            el.style.zIndex = zidx;
            el.style.background = this.options.bg;
            el.style.color = this.options.fg;
            el.style.lineHeight = el.style.minHeight;
            el.style.padding = '5px 16px';
            el.style.fontFamily = this.options.fontFamily;
            el.style.fontSize = this.options.fontSize;

            if ('top' === this.options.position) {
                el.style.top = 0;
            } else {
                el.style.bottom = 0;
            }

            /*
             * Génération du html
             */

            el_x = doc.createElement('div');
            el_x.className = 'cookiebanner-close';
            el_x.style.cursor = 'pointer';
            el_x.style.cssFloat = 'right';
            el_x.style.paddingLeft = '5px';
            el_x.innerHTML = this.options.closeText;
            Utils.on(el_x, 'click', function(){
                self.agree_and_close();
            });

            el_a = doc.createElement('a');
            el_a.href = this.options.moreinfo;
            el_a.style.textDecoration = 'none',
            el_a.style.color = this.options.link;
            el_a.style.padding = '0 5px';
            el_a.innerHTML = this.options.linkmsg;

            this.pipe = doc.createElement('span');
            this.pipe.style.color = this.options.link;
            this.pipe.innerHTML = '|';

            this.configure = doc.createElement('span');
            this.configure.style.cursor = 'pointer';
            this.configure.style.padding = '0 5px';
            this.configure.style.color = this.options.link;
            this.configure.innerHTML = this.options.configure;

            this.info = doc.createElement('span');
            this.info.innerHTML = this.options.message;
//            this.info.appendChild(el_a);

            el.appendChild(el_x);
            el.appendChild(this.info);
            for (name in this.agreeMask) {
                if (this.isAllowed(name, this.askBinary)) {
                    el.appendChild(this.askForm(name, false));
                }
            }


            el.appendChild(el_a);
            el.appendChild(this.pipe);
            el.appendChild(this.configure);

//            if (!first) {
//                this.info.style.display = 'none';
//            }

            Utils.on(this.configure, 'click', function(){
                self.nextQuestion();
            });

            this.element = el;

            if (this.element_mask) {
                Utils.on(this.element_mask, 'click', function(){
                    self.agree_and_close();
                });
                doc.body.appendChild(this.element_mask);
            }


            doc.body.appendChild(this.element);
            this.inserted = true;

            if ('fade' === this.options.effect) {
                this.element.style.opacity = 0;
                Utils.fade_in(this.element);
            } else {
                this.element.style.opacity = 1;
            }
        }
    };

    if (script_el_invoker) {
        if (!context[global_instance_name]) {
            context[global_instance_name] = new Cookiebanner();
        }
    }

})(window);
