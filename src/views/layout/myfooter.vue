<script setup>

</script>

<template>
<div class="container">
  <div class="flex-box">
  <div class="footer-content">
    <p>
      Powered by Dls & Designed by Gyoza
    </p>
  </div>
  <div class="footer-content">
    <p>
      Contact us: <a href="2879664978@qq.com" style="text-decoration: none; color: rgb(255, 102, 102,0.5);">2879664978qq.com</a>
    </p>
  </div>
  <div class="footer-content">
    <p>
      Follow us:
      <a href="https://www.facebook.com/yourpage" style="text-decoration: none; color: rgb(255, 102, 102,0.5);">Facebook</a>,
      <a href="https://www.twitter.com/yourpage" style="text-decoration: none; color: rgb(255, 102, 102,0.5);">Twitter</a>,
      <a href="https://www.instagram.com/yourpage" style="text-decoration: none; color: rgb(255, 102, 102,0.5);">Instagram</a>
    </p>
  </div>
    <div class="footer-content">
      <p>
        已经运行了 0 天  共写了 0.0k 字
      </p>
    </div>
    <div class="footer-content">
     <div class="btn-box">
       <button class=" sun">
    <img src="@/assets/img/sun.png" style="height: 24px; width: 24px;" alt="">
       </button>
       <button class="bytedance">
        <img src="@/assets/img/bytedance.png" style="height: 24px; width: 24px;" alt="">
       </button>
       <button class=" moon ">
        <img src="@/assets/img/moon.png" style="height: 24px; width: 24px;" alt="">
       </button>
     </div>
    </div>
</div>
</div>
</template>

<style scoped>
.container{
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 50px;
  padding-bottom: 50px;
  /*设置字体*/
  color: rgb(30,30,30,0.5);
  font-size: 20px;
  .footer-content{
    margin-top: 20px;
      /*所有box在居中的基础上再次居中,按钮居中 */
      display: flex;
      justify-content: center;
      align-items: center;
    .btn-box{
      height: 50px;
      width: 200px;
      background: black;
      border-radius: 25px;
      padding: 2px;
      display: flex;
      justify-content: space-between;
      button{
        /*图标居中*/
        display: flex;
        justify-content: center;
        align-items: center;

        height: 45px;
        width: 45px;
        background: white;
        border-radius: 50%;
        font-size: 20px;
        color: black;
        &:hover{
          cursor: pointer;
        }
      }
    }
  }
}
</style>
