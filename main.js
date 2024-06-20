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
    } else {
        result += 10000 * 0.02;
    }
    return Math.floor(result + (exam - 40000) * 0.01);
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
        processed -= 5000 * 0.15;
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
        processed -= 10000 * 0.02;
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

function calcTarget() {
    var target = $("input[name='calc-target']:checked").attr("id");
    if (target === "final2exam") {
        calcNecessaryScoce();
    } else {
        calcEvaluation();
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

function binarize(imageSrc, threshold) {
    return new Promise((resolve, reject) => {
        var $canvas = $("<canvas>");
        var ctx = $canvas[0].getContext("2d");
        var $img = $("<img>");
        $img.on("load", function() {
            $canvas.attr("width", this.width);
            $canvas.attr("height", this.height);
            ctx.drawImage($img[0], 0, 0);
            
            var imageData = ctx.getImageData(0, 0, $canvas[0].width, $canvas[0].height);
            var data = imageData.data;
            for (var i = 0; i < data.length; i += 4) {
                var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                if (avg >= threshold) {
                    var value = 252;
                } else {
                    var value = 0;
                }
                data[i]     = value;
                data[i + 1] = value;
                data[i + 2] = value;
            }
            ctx.putImageData(imageData, 0, 0);
            
            var dataURL = $canvas[0].toDataURL();
            resolve(dataURL);
        });
        $img.on("error", function(err) {
            reject(err);
        });
        $img.attr('src', imageSrc);
    });
}

function recognizeParameters(imageSrc, points) {
    var [leftX, topY, rightX, bottomY] = points;
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

function getParametersArea(imgSrc, margin=5) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            const width = img.width;
            const height = img.height;
            const ratio = width / height;
            console.log(ratio);
            console.log(9 / 16 * (100 - margin) / 100, 9 / 16 * (100 + margin) / 100);
            if (ratio > 9 / 16 * (100 - margin) / 100 && ratio < 9 / 16 * (100 + margin) / 100) {
                const points = [
                    [width * 0.15, height * 0.71, width * 0.31, height * 0.77],
                    [width * 0.15, height * 0.77, width * 0.31, height * 0.83],
                    [width * 0.15, height * 0.83, width * 0.31, height * 0.89],
                ];
                resolve(points);
            }
        };
        img.src = imgSrc;
    });
}

$(function() {
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
            getParametersArea(img.src)
                .then((points) => {
                    var [voArea, daArea, viArea] = points;
                    console.log(voArea);
                    console.log(daArea);
                    console.log(viArea);
                    binarize(img.src, 200)
                        .then((dataUrl) => {
                            // $(".preview").attr("src", dataUrl);
                            // Vocal
                            recognizeParameters(dataUrl, voArea)
                                .then((text) => {
                                    $("#vo").val(Number(text));
                                });
                            // Dance
                            recognizeParameters(dataUrl, daArea)
                                .then((text) => {
                                    $("#da").val(Number(text));
                                });
                            // Visual
                                recognizeParameters(dataUrl, viArea)
                                .then((text) => {
                                    $("#vi").val(Number(text));
                                });
                        }) 
                        .catch((err) => {
                            console.log(err);
                        });
                })
                .catch((err) => {
                    console.log(err);
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

    $("#before").on("click", function() {
        $("#msg-before").css("display", "inline");
        $("#msg-after").css("display", "none");
    });
    $("#after").on("click", function() {
        $("#msg-before").css("display", "none");
        $("#msg-after").css("display", "inline");
    });

    $("input[name='order']").on("change", function() {
        var order = $("input[name='order']:checked").attr("id");
        var bonus = 0;
        switch (order) {
            case "order-1":
                bonus = 1700;
                break;
            case "order-2":
                bonus = 900;
                break;
            case "order-3":
                bonus = 500;
                break;
            default: 
                bonus =  0;
        }
        $("#order-bonus span").html(bonus);
    });

    $("#vo").on("change focusout", calcTarget);
    $("#da").on("change focusout", calcTarget);
    $("#vi").on("change focusout", calcTarget);
    $("input[name='is-before-exam']").on("change focusout", calcTarget);
    $("input[name='order']").on("change focusout", calcTarget);
    $("input[name='calc-target']").on("change focusout", calcTarget);
    $("#exam").on("change focusout", calcTarget);
    $("#evaluation").on("change focusout", calcTarget);

    $("#s").on("click", function() {
        $("#evaluation").val(13000);
    });
    $("#a_p").on("click", function() {
        $("#evaluation").val(11500);
    });
    $("#a").on("click", function() {
        $("#evaluation").val(10000);
    });
    $("#b_p").on("click", function() {
        $("#evaluation").val(8000);
    });
    $("#b").on("click", function() {
        $("#evaluation").val(6000);
    });
    $("#c_p").on("click", function() {
        $("#evaluation").val(4500);
    });
});
