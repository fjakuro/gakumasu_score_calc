function processedExam(exam) {
    var result = 0;

    if (exam < 5000) {
        return Math.floor(exam * 0.3);
    } else {
        result += 5000 * 0.3;
    }
    if (exam < 10000) {
        return Math.floor(result + (exam - 5000) * 0.15);
    } else {
        result += 5000 * 0.15;
    }
    if (exam < 20000) {
        return Math.floor(result + (exam - 10000) * 0.08);
    } else {
        result += 10000 * 0.08;
    }
    if (exam < 30000) {
        return Math.floor(result + (exam - 20000) * 0.04);
    } else {
        result += 10000 * 0.04;
    }
    if (exam < 40000) {
        return Math.floor(result + (exam - 30000) * 0.02);
    }
    return -1;
}

function invertedExam(processed) {
    var origin = 0;

    if (processed < 5000 * 0.3) {
        return Math.floor(processed / 0.3);
    } else {
        origin += 5000;
        processed -= 5000 * 0.3;
    }
    if (processed < 5000 * 0.15) {
        return Math.floor(processed / 0.15) + origin;
    } else {
        origin += 5000;
        processed -= 5000 * 0.3;
    }
    if (processed < 10000 * 0.08) {
        return Math.floor(processed / 0.08) + origin;
    } else {
        origin += 10000;
        processed -= 10000 * 0.08;
    }
    if (processed < 10000 *0.04) {
        return Math.floor(processed / 0.04) + origin;
    } else {
        origin += 10000;
        processed -= 10000 * 0.04;
    }
    if (processed < 10000 * 0.02) {
        return Math.floor(processed / 0.02) + origin;
    } else {
        origin += 10000;
        return Math.floor(processed / 0.01) + origin;
    }
}

function addExamBonus(parameter, order) {
    var bonus = 10 * (4 - order);
    if (parameter + bonus > 1500) {
        return 1500;
    } else {
        return parameter + bonus;
    }
}

function recognizeParameters(imageSrc, leftX, topY, rightX, bottomY) {
    var width = rightX - leftX;
    var height = bottomY - topY;
    return new Promise((resolve, reject) => {
        var $canvas = $("<canvas>");
        var ctx = $canvas[0].getContext("2d");
        var $img = $("<img>");
        $img.on("load", function() {
            $canvas.attr("width", width);
            $canvas.attr("height", height);
            ctx.drawImage($img[0], leftX, topY, width, height, 0, 0, width, height);
            var trimmedImageSrc = $canvas[0].toDataURL();
            Tesseract.recognize(trimmedImageSrc, 'jpn')
                .then(({ data: { text } }) => {
                    resolve(text);
                })
                .catch((err) => {
                    console.error(err);
                    reject(err);
                })
        });
        $img.attr('src', imageSrc);
    });
}

function getTotalParameters() {
    var vo = Number($("#vo").val());
    var da = Number($("#da").val());
    var vi = Number($("#vi").val());
    if ("#is-before-exam") {
        var order = Number($("input[name='order']:checked").attr("id").split("-")[1]);
        [vo, da, vi] = [vo, da, vi].map((value) => {
            return addExamBonus(value, order)
        });
    }
    total_parameter = Math.floor((vo + da + vi) * 2.3);
    return total_parameter;
}

function getOrderBonus() {
    var order = $("input[name='order']:checked").attr("id");
    switch (order) {
        case "order-1": return 1700;
        case "order-2": return 900;
        case "order-3": return 500;
        default: return 0;
    }
}

function calcEvaluation() {
    var total_parameter = getTotalParameters();
    var exam = Number($("#exam").val());
    var order_score = getOrderBonus();
    var evaluation = total_parameter + processedExam(exam) + order_score;
    $("#evaluation").val(evaluation);
}

function calcNecessaryScoce() {
    var total_parameter = getTotalParameters();
    var evaluation = Number($("#evaluation").val());
    var order_score = getOrderBonus();
    var processed = evaluation - (total_parameter + order_score);
    var originalExam = invertedExam(processed);
    $("#exam").val(originalExam);
}

$(function() {
    $("#before").on("click", function() {
        $("#order").css("display", "flex");
        $("#msg-before").css("display", "inline");
        $("#msg-after").css("display", "none");
    });
    $("#after").on("click", function() {
        $("#order").css("display", "none");
        $("#msg-before").css("display", "none");
        $("#msg-after").css("display", "inline");
    });

    $("#input-file").on("change", function(e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function(f) {
            var img = new Image();
            img.src = f.target.result;
            img.onload = function() {
                $(".preview").attr("src", img.src);
                // console.log(img.src);
            };
            
            // Vocal
            recognizeParameters(img.src, 115, 960, 230, 1005)
                .then((text) => {
                    $("#vo").val(Number(text));
                });
            // Dance
            recognizeParameters(img.src, 115, 1045, 230, 1085)
                .then((text) => {
                    $("#da").val(Number(text));
                });
            // Visual
                recognizeParameters(img.src, 115, 1130, 230, 1170)
                .then((text) => {
                    $("#vi").val(Number(text));
                });
        };
        reader.readAsDataURL(file);
    });

    $("#upload-file").on("click", function() {
        $("#input-file").click();
    });
    $(".preview").on("click", function() {
        $("#input-file").click();
    });

    $("#exam").on("change", function(){
        calcEvaluation();
    });

    $("#evaluation").on("change", function(){
        calcNecessaryScoce();
    });
});
