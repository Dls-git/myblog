<script setup>

</script>

<template>
  <div class="container">
    <div class="text">
      <h2 class="text-title">Hi there, I'm violet👋
        <br>
        Only the paranoid survive.</h2>
      <p class="text-content small-font">We're not exactly in a position to be trusted with secrets, are we?</p>
      <div class="other-link">
        <button class="other-link-bth" >
          <img src="@/assets/img/github.png" alt="github">
        </button>
        <button class="other-link-bth">
          <img src="@/assets/img/QQ.png" alt="QQ">
        </button>
        <button class="other-link-bth">
          <img src="@/assets/img/wechat.png" alt="wechat">
        </button>
        <button class="other-link-bth">
          <img src="@/assets/img/mail.png" alt="mail">
        </button>

      </div>
    </div>
    <div class="my-image ">
      <img src="@/assets/img/Mikasa.jpg" alt="邓力升">
    </div>
  </div>
</template>

<style scoped>
.container{
  display: flex;
  margin-top: 300px;
  height: 500px;
  .text{
    height: 100%;
    flex: 1;
    border: rebeccapurple 5px solid;
    .text-title{
      margin-top: 70px;
      font-size: 40px;
    }
    .text-content{
      margin-top: 15px;
    }
    .other-link{
      margin-top: 50px;
      border: cadetblue 5px solid;
      display: flex;
      .other-link-bth{
        border-radius: 50%;
        height: 50px;
        width: 50px;
        &:not(:first-child) {
          margin-left: 10px;
        }
        &:hover{
          /*动画效果*/
          animation: ToWide 0.3s ease-in-out forwards;
          cursor: pointer;
        }
        /*让图标压在按钮里*/
        img{
          width: 30px;
          height: 30px;
        }
      }

    }
  }
  .my-image{
    height: 100%;
    flex: 1;
    display: flex;
    justify-content: center;
    border: blue 5px solid;
    img{
      border-radius: 50%;
      height: 450px;
      width: 450px;
      object-fit: cover;
    }
  }
}
@keyframes ToWide {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.2);
  }
}


</style>
