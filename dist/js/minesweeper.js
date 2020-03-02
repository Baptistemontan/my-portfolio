(function () {
    let difficulty = [{ scl: 10, ratio: 0.1 }, { scl: 15, ratio: 0.15 }, { scl: 25, ratio: 0.2 }, { scl: 35, ratio: 0.2 }], Board;

    function BoardObject(scl, ratio) {
        this.scl = scl;
        this.tab = [];
        this.clicked = [];
        this.clicked.length = scl * scl;
        this.ratio = ratio;
        this.paused = true;
        this.time = (new Date()).getTime();
        this.timer = 0;
        this.gameover = true;
        this.remaining = this.bombs = Math.floor(scl * scl * ratio);
        this.started = false;
        this.get = (x, y) => {
            return this.tab[x + y * this.scl];
        }
        this.push = (x, y, value) => {
            this.tab[x + y * this.scl] = value;
        }
        this.add = (x, y, value) => {
            if (this.get(x, y) == undefined) {
                this.push(x, y, 0);
            }
            this.tab[x + y * this.scl] += value;
        }
        this.click = (x, y, first = true) => {
            if (!this.clicked[x + y * this.scl] && x >= 0 && x < this.scl && y >= 0 && y < this.scl) {
                if (first && this.get(x, y) == -1) {
                    return true;
                }
                if (this.get(x, y) != -1) {
                    this.clicked[x + y * this.scl] = true;
                }
                if (this.get(x, y) == undefined) {
                    for (var i = -1; i < 2; i++) {
                        for (var j = -1; j < 2; j++) {
                            if (!this.clicked[x + i + (y + j) * this.scl]) {
                                this.click(x + i, y + j, false);
                            }
                        }
                    }
                }
            }
        }
        this.show = (win = true) => {
            var cell, test = win;
            for (var i = 0; i < this.scl; i++) {
                for (var j = 0; j < this.scl; j++) {
                    if (this.clicked[i + j * this.scl]) {
                        cell = $('#minesweeper #cell' + i + "-" + j + "-");
                        if ((cell.hasClass("flag") || cell.hasClass('questionMark')) && test) {
                            Board.remaining++;
                        }
                        cell.removeClass("hidden flag questionMark");
                        if (this.get(i, j) == undefined) {
                            cell.html("<div class='n0'><div/>");
                        } else if (this.get(i, j) == -1) {
                            cell.addClass("bomb");
                        } else if (this.get(i, j) == -2) {
                            cell.addClass("bomb good");
                        } else {
                            cell.html("<div class='n" + this.get(i, j) + "'>" + this.get(i, j) + "<div/>");
                        }
                    } else if (this.get(i, j) != -1 && win) {
                        win = false;
                    }
                }
            }
            this.refreshFlags();
            if (win) {
                GameOver(true);
            }
        }
        this.reveal = () => {
            for (var i = 0; i < this.scl; i++) {
                for (var j = 0; j < this.scl; j++) {
                    if (this.get(i, j) == -1) {
                        if ($('#minesweeper #cell' + i + "-" + j + "-").hasClass("flag")) {
                            this.push(i, j, -2);
                        }
                        this.clicked[i + j * this.scl] = true;
                    }
                }
            }
            this.show(false);
        }
        this.refreshFlags = () => {
            $("#minesweeper #flags > p").html('' + this.remaining + '/' + this.bombs);
        }
    }

    function newBoard(scl, ratio) {
        Board = new BoardObject(scl, ratio);
        Board.gameover = false;
        toggleTimer(false);
        toggleTimer();
        $("#minesweeper #time").css("color", "");
        let i, j, text = '';
        for (i = 0; i < scl; i++) {
            for (j = 0; j < scl; j++) {
                text += '<div id=\'cell' + j + "-" + i + "-" + '\' class=\'cell hidden\'></div>';
            }
        }
        $("#minesweeper #board").css("grid-template-columns", "repeat(" + scl + ", " + 100 / scl + "%)").html(text);
        i = 0;
        while (i < Board.remaining) {
            var x = Math.floor(Math.random() * scl),
                y = Math.floor(Math.random() * scl);
            if (Board.get(x, y) != -1) {
                Board.push(x, y, -1);
                for (j = -1; j < 2; j++) {
                    for (var k = -1; k < 2; k++) {
                        if (x + j < scl && x + j >= 0 && y + k < scl && y + k >= 0 && Board.get(x + j, y + k) != -1) {
                            Board.add(x + j, y + k, 1);
                        }
                    }
                }
                i++;
            }
        }
        $("#minesweeper .cell").click(function (e) {
            if (!Board.started) {
                Board.paused = false;
                Board.started = true;
            }
            if (!Board.paused) {
                var x = '', y = '', i = 4;
                while (e.currentTarget.getAttribute('id')[i] != '-') {
                    x += e.currentTarget.getAttribute('id')[i++];
                }
                i++;
                while (e.currentTarget.getAttribute('id')[i] != '-') {
                    y += e.currentTarget.getAttribute('id')[i++];
                }
                if (Board.click(parseInt(x), parseInt(y))) {
                    GameOver(false);
                    $(this).addClass("lose");
                }
                Board.show();
            }
        }).contextmenu(function () {
            if (!Board.paused) {
                let cell = $(this);
                if (cell.hasClass("hidden")) {
                    if (cell.hasClass("flag")) {
                        cell.removeClass("flag");
                        cell.addClass("questionMark");
                    } else if (cell.hasClass("questionMark")) {
                        cell.removeClass("questionMark");
                        Board.remaining++;
                    } else if (Board.remaining > 0) {
                        cell.addClass("flag");
                        Board.remaining--;
                    }
                }
                Board.refreshFlags();
            }
        });
        Board.refreshFlags();
    }

    function GameOver() {
        Board.paused = true;
        Board.gameover = true;
        Board.reveal();
        $("#minesweeper #time > p").css("color", "red");
        toggleTimer(false);
    }

    function Timer() {
        let tmp = (new Date()).getTime();
        if (!Board.paused) {
            Board.timer += tmp - Board.time;
        }
        Board.time = tmp;
        var minutes = (new Date(Board.timer)).getMinutes(),
            seconds = (new Date(Board.timer)).getSeconds();
        minutes = "" + minutes > 9 ? minutes : ("0" + minutes);
        seconds = "" + seconds > 9 ? seconds : ("0" + seconds);
        var text = "" + minutes + ":" + seconds;
        $("#minesweeper #time > p").html(text);
    }

    function toggleTimer(toggle = true) {
        if (toggle) {
            setInterval(Timer, 500);
        } else {
            clearInterval(Timer);
        }
    }

    $(() => {
        newBoard(difficulty[1].scl, difficulty[1].ratio);
        $("#minesweeper #board").contextmenu(e => $.Event(e).preventDefault());
        $("#minesweeper #newgame").click(() => newBoard(Board.scl, Board.ratio));
        $("#minesweeper #pause").click(() => {
            if (!Board.gameover && Board.started) {
                let cell = $("#minesweeper #time > p");
                if (Board.paused) {
                    Board.paused = false;
                    cell.css("color", "");
                    toggleTimer();
                } else {
                    Board.paused = true;
                    cell.css("color", "red");
                    toggleTimer(false);
                }
            }
        });
        $("#minesweeper #difficulty").click(() => {
            $("#minesweeper #buttons1").css("display", "none");
            $("#minesweeper #buttons2").css("display", "block");
        });
        $("#minesweeper .diff").click(function () {
            let id = parseInt($(this).attr('id')[4]);
            newBoard(difficulty[id].scl, difficulty[id].ratio);
            $("#minesweeper #buttons2").css("display", "none");
            $("#minesweeper #buttons1").css("display", "block");
        });
        $("#minesweeper #back").click(() => {
            $("#minesweeper #buttons2").css("display", "none");
            $("#minesweeper #buttons1").css("display", "block");
        });
    });
})()

