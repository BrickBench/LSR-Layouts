document.body.innerHTML += `
<div class="d-flex flex-row justify-content-between" id="bottom-bar">
    <div class="p-3 right-border" id="legothon-bg-bottom">
        <img class="img-fluid" src="./OldLayouts/2024_Legothon_Main_Logo.png" style="height:65px"/>
    </div>
    <div id="title-carousel" class="p-2 carousel slide right-border" style="width:15%; height:100%;">
        <div id="title-carousel-inner" class="carousel-inner">
            <div class="carousel-item active">
                <p class="text-center mt-2 row-title">UP NEXT</p> 
            </div>
            <div class="carousel-item">
                <p class="text-center mt-2 row-title">INCENTIVE</p> 
            </div>
            <div class="carousel-item">
                <p class="text-center mt-2 row-title">INCENTIVE</p> 
            </div>
            <div class="carousel-item">
                <p class="text-center mt-2 row-title">INCENTIVE</p> 
            </div>
            <div class="carousel-item">
                <p class="text-center mt-2 row-title">TARGET</p> 
            </div>
            <div class="carousel-item">
                <p class="text-center mt-2 row-title">DONORS</p> 
            </div>
        </div>
    </div>
    <div id="data-carousel" class="carousel slide carousel-fade flex-fill" style="width:65%;">
        <div id="data-carousel-inner" class="carousel-inner">
            <div class="ps-3 carousel-item d-flex flex-row align-items-center justify-content-between active">
                <div class="flex-column" style="width: 60%;">
                    <div class="p-0 flex-shrink-1" id="next-runner-name"></div>
                    <div class="p-0" id="next-runner-game"></div>
                </div>
                <div class="p-0" id="next-runner-time" style="width: 20%"></div>
            </div>
            <div class="carousel-item" id="incentive-1"></div>
            <div class="carousel-item" id="incentive-2"></div>
            <div class="carousel-item" id="incentive-3"></div>
            <div class="ps-4 carousel-item d-flex flex-row align-items-center justify-content-evenly" style="height: 100px;">
                <div class="flex-fill align-items-center">
                    <div class="progress" role="progressbar" aria-valuenow="10" aria-valuemin="0" aria-valuemax="100" id="donation-bar" style="height: 40px">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 10%" id="donation-progress"></div>
                    </div>
                </div>
                <div class="ps-2 text-center align-items-center" style="width: 20%" id="goal-amount""> $2300 </div>
            </div>
            <div class="carousel-item">
                <div class="d-flex flex-row align-items-center justify-content-evenly flex-fill">
                    <div class="d-flex flex-column flex-fill">
                        <div class="p-0 text-center donor-name" id="donor-1-name"></div>
                        <div class="p-0 text-center money" id="donor-1-amount"></div>
                    </div>
                    <div class="d-flex flex-column flex-fill">
                        <div class="p-0 text-center donor-name" id="donor-2-name"></div>
                        <div class="p-0 text-center money" id="donor-2-amount"></div>
                    </div>
                    <div class="d-flex flex-column flex-fill">
                        <div class="p-0 text-center donor-name" id="donor-3-name"></div>
                        <div class="p-0 text-center money" id="donor-3-amount"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="text-center flex-fill align-items-center left-border" id="donation-total" style="width:15%; height:100%">
        $200
    </div>
</div>
`;

if (!document.body.classList.contains("lego-tile")) {
    document.getElementById("bottom-bar").style.background = "#272727";
}
