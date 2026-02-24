// --- content-data.js ---
// This file stores the static data for the LAA Uplift Data Capture Web Application.

const LAA_GUIDE_URL = "https://assets.publishing.service.gov.uk/media/66f13cfa76558d051527abb9/Costs_Assessment_Guidance_2024_SCC_-_Version_1a-_23_September_2024.pdf";
const LAA_GUIDE_VERSION_INFO_CONST = "Based on LAA Costs Assessment Guidance (Version 1a, 23 September 2024)";
const LAA_PUBLICATIONS_PAGE_URL = "https://www.gov.uk/government/collections/legal-aid-guidance-for-professionals";
const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAX4AAAF+CAYAAACF2nH8AAAAAXNSR0IB2cksfwAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAZiS0dEAP8AqAD/yU6fpgAAAAlwSFlzAAASdAAAEnQB3mYfeAAAAAd0SU1FB+kFEg4aNSNv43wAACAASURBVHja7Z13fFRV+safTBrpPSRAyCQhlNBCCU2QICqCIiBYsFBc2V1cFfjZVncVcdddCy6gq+juasC6AgI2sKwGBEUTIAFCCCXJJJRU0khPyPz+iEFKpt87uffc5/v57GfVmbmZOXPOc595z3ve1wWEqIjK2uZYQ1lDLgAYyuphKKsHABSUNaLjv1XVtQAAqup/+f+61gv/bIlAb/f2//dxQ6C3OwJ9Ov7dHYHe7gjwdr3wz/owb+jDvRDo7R4X5OuRx2+HqAUXDgFRkqhX1bfkGkobkFlQjYKyRlTVt8BQWg9DWQOq6lsuiLoS0Yd5I1Hvj0Afd0SHdkOgjzsSowOgD/dCTLgP1xqh8BO6dkNZPTIN1diZXdEu8GUNihZ2qW4MQ6P92n8thHlj0qBQrkFC4SfiiXymoSY3s6Bd4NvDM2ILvCM3hOSEUCTq/Rk6IhR+oj6RP1BwDpmGamQaajgwEtwM+MuAUPiJooR+R3Y5PtlbQicvMzOTIngjIBR+QqHnjYA3AkLhJzKI/Y7ss7mf7C3B1vRiCr3CbwQzRnbHzKQI7hEQCj+xjYz8auPW9CK6egF+DcxMisSwmACuc0LhJ1eSmlVu7AjhcENWLBL1/khOCMX8ib14EyAUfjr7X509xV4b6MO8MTMpAkum6XmojMJPtEJlbXPsup0nc9fvPEWx1zjJCSGYmBCMpdNiuSdA4Sciin2moSZ3zfZ87Mg+y5g9uYKOjeGFk3pTEyj8RM3kl9YZ1+04ifU7T18oZkaIJZZOi2UoiMJP1OjuV2w6hsyCGrp7wl8BhMIvsuCv3paXy41aIjX6MG/Mn9gTK27rT72g8BMlkF9aZ1yzzYB1O0/S3RPZYRiIwk+6kNSscuMne0so+KRLmJkUgeVz+vJcAIWfOEvwl71zmOEcogiSE0Iwf2Iv7gNQ+AkFn2iNRL0/lkyN4Q2Awk8o+IQ3AELhJxR8whsAofCTKwV/zfZ8bE0v5mAQ1ZOcEIKU+4cyC4jCTzqjIy1z9TaWTCHisSA5CsvnxPMGQOEnQPvBqxWbjucyLZNogaXTYrF6wUDqDoVfu4K/Nb04d8Wm46yjQzTHqvkJWHZjHPWHwq8duHFLSPsGcMriRB4Co/CL7/IZ1iHkUhj/p/ALS0pqoXHZO9kUfEJMwPAPhV8YMvKrjcvWH8aO7LMcDEIswPAPhV/VMKxDiP0w+4fCrzq4eUsI3T+Fny6fEEL3T+EXjYz8auPCtZl0+YTQ/VP4teDy1+08mbti03G6fEJkZvmceLaApPB3vegvXHsglwXVCHGu+9/yyEjm/VP4nU9qVrlx1st76fIJ6SJSFg9l2WcKv/Nc/opNx3NZRZOQrocbvxR+2eEGLiHKgxu/FH7ZYGiHEGXD0A+FXzIY2iFEPTD0Q+GXRPSZtUOIukjU+yP16bFxQb4edGsUftvIyK82zlq5l01SCFEhgT7uSH16LOP+FH7r2ZJWZFy49gDj+YSoHJZ6pvBbxfINOcYVm45zIAgRZU3ztC+F3xSVtc2xy97Jzl234yQHgxDBSE4IwY5nxlHvKPyXij43cQkRG276UvgvwE1cQrSDPswbWx4ZqflNX01/eIo+IdqDGT8aFn6exCVE22x5ZCRmjYrUpAZq8kOv+iLXyPr5hBCtlnnQUfQJIVpl4doDWPVFrpGOX3DRX7Y+m7OdEHIJWsv118wHpegTQij+GhJ+nsYlhFiDVqp7Cv8BKfqEEIq/hoSfok8IofhrSPgp+oQQin/nCJnO2ZGySQgh9rJ6Wx6WrjssZKqncMLP7B1CiJTiv3xDjnDiL5TwU/QJIVKzYtNxpKQWCiX+wgg/wzuEELlYuPaAUOIvhPCnpBayDAMhRHbx35JWJIT4q37HOiO/2jjp2T0UfUKIU0h9eiwmDQpVtXaq2vHnl9ZR9AkhTmXWy3uRkV+tauevWuGvrG2OnbWS9fQJIc6lqq4Fk57dg8ra5lgKv5NFf+HaA7mZhhrOQkJIV4l/LoXfiSx7J5uN0QkhXUqmoQbJz/yoypCP6oR/1Re5xnU7TnLWEUK6nB3ZZ1V5uldVwp+SWsgDWoQQRbF6W57qcvxVI/wZ+dXGZe9Q9AkhymPh2gOqyvRRhfC3b+ZmMoOHEKJY1JTpo3jhZwYPIUQNVNW1YNbKvarI9FH86TPW1VcPXh6uGBrtf+F/fXv4INjHHUG+Hgj2dYePpyvONbSipqEVZyobcaK4HieK6/D9kbP4/kgFzrcZOYhE9cxMisDWR5MUra2KfnMpqYXGhWsPcCYpmOSEEEwZGoYpQ8MwLCbA7uu0njdi409n8N8fz+DTvSUcWKJqtjwyErNGRSpWXxX7xvJL64zDHt/FuL7C8HDT4baxkbhxWHdMGRqGIF93yf/Gt4fK8eePjuKn45UccKJKAn3ckfr0WAyLCVCkxiryTf1SjiF3R/ZZziCFMDUxHLeNjcRt43rA28PVKX9z1Rd5+PNHR1HfdJ5fAFEd+jBvGF6bTOG3lqXrDhtXb8vjzOli4iN98Ltro3H72B7oFdKtS95DXkk9pr+YjuxT5/iFENWh1Hi/4t7QlrQi46yVezljupDkhBD87rpo3DGuhyLeT2F5A6a/mI6DBczsIupDifF+Rb0ZxvW7ljvH98Tvr43GhAHBdl/jRHEd9hyrRM6ZWhw9U4czlY0oqW5CN3dX3DY2ErHh3rjn6l42X/dMZSOmv5CO/fnV/KKIqgj0cUfGCxMQE+6jGL1VlPDPfCndyOJrzmfBxF54ZHocBkb52fzappY2fLq3BNsySvD9kQrkldZbfM2MkRHY+uhIm/9WXmk9Ev5vB5pa2vilEVWRqPdH5osTKfyXw0bpXePwH5keh2F6f5tfu37nKXy6rwSf7S1Gy3nb8+8XTe6Nf/12iM2v++dXBjz4dha/PKI6Vs1PwLIb4xShuYp4E2yf6FxuHROJR6bHYVSfQJtel3OmFimpJ5Gy4yTKapodfh85q5LRr4evza+b9nwatmeU8oskqiPjhasVkeLp1tVvgJ20nMfEhBA8PTse1wwKtel12zJK8cY3Bfhsn7QHqzb+VIQ/3xJv8+tW3p1A4SeqRCmJK11eq2f1tjzm68tMTLg3UhYPxY7lY20S/a3pxUhesQc3Pp8muegDQOph+773hF6+mD+xF79YojoMZfVY8Hpml9cm6VLHn5pVbpz1MlM35cJV54KnZ8fjqTl9bYrpbU0vxsuf52F3ToWs7++IA7n591zdC+t3nuKXTFTHuh0nkZFfbezKkE+XCT9DPPKyIDkKz8zpi+gwL6tf88PRCjyz8Rj+d6jcKe+xqKoJreeNcHO1ff5PHhSKQVF+yDrJg11EfXR1yKfLQj0M8cjD4N5++OzxJKQsHmq16JdUN+F3/zqI8U//6DTR76CmodXu1867muEeok4MZfVd2rKxS4Q/I7/auGa7gd++xCyf0xcHX5qIm4Z3t/o1r39tQL+lqfjXt4Vd8p4bW+yvwzMjKYJfOlEtq7fldVnXri4J9Sxbf5ghHgm5aXh3/G1ufwzubf0BrL151fjj+0fwbVa5aj9330gfBPu6o6KWc4mok64K+Tjd8a/6ItfIEI80BPu64+3FQ/HZ40k2if4zG48h6YldihB9TzfHpuDI2EBOBKJaDGX1WPVFrtNdv1Mdf2Vtc2zMg9/x25aAOWMisXr+QPQMtr5q5s7ss3j43Wzsy1NOvRtPd8eEf0RsAL4+WMYJQVTLik3HkV9aZ3RmLR83J3/AXIZ4HBfK1fMH4vfXRdv0umc/Po7lG44q6rN083CFbzfHpuDIODp+om6q6lrg7HI1ThP+1Kxy46Rn9/BbdoCpw8Kxev5A9I30sfo12adq8VBKliJj+aESdO/S25CuSohS2Zpe3K6Rg0Kd4vqdJvwrNh3jt+sAK+9JwMM3xdr0mne/P4Xf/usgGhVazTIyyPHmLkE+7pwcRAic2V/cKZu73NC1n6S4QOx7foLNor9s/WHMey1TsaIPtHf4clj4fSn8RAycudEru+Pnhq79LL4+Gq//ZrBNrzleVIf73jyA749UKP7z9ZVA+AO93aFzcUGb0cgJQ1SPszZ6ZRf+1dvyuKFrIx5uOryxaDAWJkfZ9LotacX4zRsHUKmS8ZZC+Dtc/9lzzZw4RPVU1bVgxabj6nb8Ha0UifVc1S8YbywajEE2dsP66+bjeOqjo6r6rPGRvpJcp5u7jhOHCMO6HSdld/2yCv+KTcd5QtcGlk6Lwar5A216TZvRiLteycB/fzyjus8rleOvbzrPyUOEQu70TtmsUmpWuXHdjpP8Bq3A3dUF7z4wzGbRLyhrwNXLf1Sl6EeFdIO/lzS+o76Zwk/EYmt6sax1fGRz/EzftI4h0f5IWTwUw2MCbHrdrpwK3PVKBk6ebVDl55aq1ML5NiObrxMhWbg2U7ZryyL8W9KKjEppMaZk7hjXA28vHgovD1ebXvfhD6dx5ysZqv7sUp241Yrbn5kUgehQL+h0LnBxAXQuLtB1/L8OcPnl311crAsLv/jJCUWn+l7OiNgARIV4IdTPA8XVTUg/UYWS6iahv/NMQ027lo6KlDzWL4vwr9mWT1W3wLO39cNTs23vN/vql/l4KOWw6j//yNgASa6jlfj+ilv7Yki0v3TzTwW/yJPiAvG7a3tjzpgeCPC+Uqo++OE0nvwwBwVlDcJ+73LF+iWP8W9JK+JhLTP4dXPDxmUj7BL9pzccFUL0pXT8RZVNws+ZhF6+koq+s5vt2IqrzgVrFgxE2t/G4zfX9O5U9AHgzqt64tjqSTb1n1AbhrJ6pKQWSh7rl1z46fZNM6pPIH567irMGRNp82vvf+sQ/vLxcSHGoV8PXwRLdOL2dEWj8PNmwcQoSa/36nblrtEhvf2x//kJeGhqjFXP93DTYeujI3HNoFBxf+3JkNcvqfDT7Ztm7lU98ONfrkJCLz/bX7tmP9Z+XSDMWEgV5mkX/gbh586CZGmF/9N9JYr8nFOGhmH3s+Ns/nXjqnPBi3cNoOvvKuGn2++cJ2b2wQcPDYerzrY9mjYjMOOldFWma5pjTHyQZNc6JbjjnzwoFGH+HpJd74PdpxU7Jz5+eCT87EzxHREbgD/fEi/sPJDa9Usm/HT7nfOv3w7B3+b2t/l1dU3nMeW5n/Dp3hLhxkTKn+Wih3oWJEvbUP7VLw2K+4xh/h7Y9H8j4OPp6tB17p0UJew8kNr1Syb8dPuXEh7gia//NBqLJve2+bVlNc24/rmfFL8JZw8x4d5I6OUr2fVEd/x3T5BO+M+3GfHT8UrFfcZXFg6yqZOcubk1Y2SEsHNhjYR7M5IIf2pWOd3+RYzuE4jdz47DdUPCbH5taU0Tbnw+DT8erRRybCZLvAmXc7pWYNHvKbzbv29yb9wxrodk17tpRLiw8yHTUCPZaV5J8vjXbKfb7+D2cT3w3gPD4OZq+5mL0pom3PR8OtJzq4Qdn2sGhUh2rer6VhSWi7u5K3k2z5fKWqfubjosn91X0mtKdSJcqSxbL006t8OOP7+0zrg1vZiKD2DZjbH475LhFH2zwi+d4z9y+pyw4xTm74HJg6Ubq6KqJuSV1CvqMy6fHY9eId0kvWai3h/eHq7Czosd2WeRX1rnsOt3WPhZiK2d5+7oj3/MS7DrtVoR/ZFxgege4CnZ9bJPiRvmET13P9TPA4/N6CPLteMivIVeR1Jk+Dgk/JW1zbFrths0L/pvLhqCJ2fZN4mr6low/QXxRR8AJksY5hHd8UudzfO6ws6BPDg1Bu6u8pSb9/cSux1nR71+R67hUIxf6921XHUu2LBsBG4ZZV8mQWNLG2au3Iu0E1WaGK/rh4ZJej1RHf+Q3v52HfQzxcGCGlTXK2edenm44qEb9LJd31SJB5FwNLzu0Ait33kaWqV7gCc2LBuBqwcE232NmS+lY6dGsqECvd1xzUBpM3r251fT7VuB0rJ5bhsbiUAf+Vy5VH0elIyj4R67Qz1b0oqMhrJ6aJGBUX747umxDon+rJV78dWBMs2M2ZREad2+oawexVViFmibd7W0wv+f7woV9fluHdND3j/gIv56qqprcehAl923xvU7T2lS9CcmhGDDshEId+AY/Z2v7IfWMqFukDjMsy9PTLc/ZWgYQvykK9GgtEOAkUGeuHG4vLn2zRppzONIGr1djl+rKZxTh4XjqydHOyT6v//3IXz4wxnNjd0UCr9ViJ67P32E/CWUm1q1IfyZhhq7N3ntcvxaTOGcMzoSG/9vhEPX+OMHR/Dm/wo0N3Zj4oMQGSRtvraown/HVdKGQZRW62lqovwna+satdOD2d5Yv12OX2ubuvOu7uWw6D+/9QRe+CQXWkRqty+q8Evt9pVWidPd1cVm4a+obcbGPUU2pTufa2zVzNqyN/Jis/BrbVN38XXRWP+HRIeu8cY3BXjiwxxolRsk3tjNOnkOZ2ubxRN+wbN5pgwNh6e79ZLzzven0Pv+b3Hb6n0Y9eRubM8step1tRpy/PZu8tos/Fra1H34pli8ft9gh67x3x/PYPF/DmlW9GPDvSWtvw8APxytEG6cIgM9MTFBugNuSqzEObav9fNgc1ox5r+WibqLeipb+4u5qLJRU2vMHk22Sfgra5tjtVKF8+nZ8Vh5T4JD19iZfRZz1+yHlpFjM0/EyqVSd9lSYiXOcf2sE/7q+lY88cGRTtdTRW2LBbffipqGVk2tMXvq99gk/Ot2ntTESd3n7xyAFbf1c+gax4vqMPcVbYs+AEwfKb3w/yCg8M+bKG2YZ+3XyhJ+Fxsc/zMbj+JYUV2nj2VYOLRXVNmkyXVma6zfpqyeT9JLhB/Al+4egEemxzl0jbqm85j7yn7NTsIOwgM8Ja+/X1jegNySOqHGaXhMAPr3kK45TXFVk0nh7CpGxQfC082yzzSUNWC1maZO+aXm9xeLqrS55mzN7rHa8WfkVwvfbEUK0Qfam6OLmm5oCzePoNu3Buk3dZXXH2NAT+tqD71i4VBSlYWaQ1qL718Yl7oWm8I9Vgv/1vQiir4V/O7fh/DZvhIQeeL7u3LEMx93jZe6RIPyztkk9LTuF837FlJQzzWcp+M3wZptBukd/yd7xRUzqUT/r5uP418aPKDVGT7dXHGzDPH977LEEv4bh4Uj2Fe6gmUHC2pQWq088RtgRZ/lzWnFFt+7TzfzTVYshYJEZt1O62/4Vgl/Rn61MdNQQ9E3w7u7TuGpj45S8X9BjqbXuSX1OHpGrFLMWsjmAawL9WxJs7xBaanypsg9mC1hS7jHKuEXNcwjlejvOlKBef/MpNpfhL09Csy7/XKhxshN54I5YyIlveY73yvznE10qJcVUQXLwm/p15FoxsBWrA33WCX8IoZ5XpRI9AvLG3D3PzOo9Bfh5+WG2aMjJb9u6mGxhF9qt/+/Q+VoVmCBsohAT4t9qNNOVOGcFfn3PczUfKptbEVBeYOm15614R6Lwi9imOeFOwfgUQlEHwDufjUDhRqfbM5w++2OX6z4vtS5+0rM5rEk1h3szrHuNHafCB+Tj+WcqdP82rM23GNR+Hdki+Wyls/pi8dmSCP69/wzE7tyKkAuRQ63n55bhZJqcTI2okK8MKF/sKTX/FShv8x7Blsh/FaU4QjwdkdEoKfJx7Ue5rng+q2onmxR+HdmiyNsj06PwzO39pXkWn/dfBzv7TrFWXYZwb7usqRxbssoFWqcpM7d/+AH5VbM7REsjeOPN+P2AW1v7F7Mmu0Gx4S/srY5VpSGK3+YoseLdw+Q5Fqbfy5iBo8T3T4AfLFfLOG/e4LUJRqUm0YcbKG/7oniOpTVWK62Gh9pXvizT53jAoR14R6zwr8j+6wQBeQXJkfhn/cOkuRaR07XYuHaA5xdJpAjvp9fWm9TPXalM6pPIPpaEDFbON9mtDpG3lW/As2RddI6wR4SbT4lNEPQlHN7sGTYzQq/CCWYbx/XA28vHirdTWRtpuaq/1lLRKAnbpChw5JwYR6JG678U6G5+x0E+ZpvVXrYWuHv7W/ysbKaZk0f3rocSyF6s8Kv9myeGUkR+O+S4ZJd7961B/Dz8SrOKie6fUC8MM9cidsrvvVdoaI/r6VQT9Ypx4XfUtVOrWGprprOzECqutPWlKFh2PrISMmu99KnuUjRYK9hm4Rfhvj+uYZWqzsvqcKMjOyOQB/pSjQUVzXh0Ellx7YthXqscfzhAZ7oFWJ6kzjDQOG/mKq6FqRmlRttFn61p3F++eRoya711YEyPPb+Ec4mM0SFeEleghkQ7/Dg/IlSl2jIV/xnttRu8cgpy9k4Q3ubj+/vz2d83xYNN/mNqD2NU6r2fCXVTVj05kHOIktuX6YwjzXH+NVCN3cdZkk8Tu9+f1rxn9tcHf6S6ia0tlkuLzPGQhMXOv4rMZfW2ek3IkKLRakOVi168yBOnuXJXIvCL0OYp6mlDZ+kiyP8UpdoOFhYo4q56WHG8VvbrMhc3+bKuhYcL+Kp3cupqmtBZW1zrNXCn2moUX2Lxd1HHBf+pzccZW19K4gN98bVA4Ilv+4ne4vRct4ozDjdPaGnpNd71YqDOkp3/GesbJxirm1j+gkmXJhia3pxrvXCX6D+n02OOv7NacX4y8fHOXO6yO23C784N92YcG9c1U/am+NHe86o4rN7uDnm+IdE+yPIzIa4VGFdETGVoNPpNyJCmYaahlacOmtfG7a80nosepOHtKwWfhni+21GiBXmkbgg2/8OlVtVzVIJuLiYrsxZVGV5jY6NNx/fF7Edp1SYivNfIfwixPc7+OZQmV2vW/TmQVTUtnDWWMGAnr5mf4bb/4urCHVN54UZp7lXSRvmeeMb9XR6M1cqutKKkPJ4C8Xs6PhNYyrOr7vyp0GD6uP7HeyyI87/p//mCNfwQ06kbiRyQfh/Fqf5z7i+QRbrzNjKxyoan6YW08Lf0Gz55p48MMTkYz8eq0RjSxsXohkyDTW5FoVfpDLMttYv+XRvCf625QRnig3cOkaebJ6PfxYnzCN17r6SK3Ha6vgbms2L9uDe/uhlpron3b4Vwt/Jnu0Vwi9SGebjxdaneJVWN+H+tw5xlthAUlwgBps5Ru+Im1ViJyl7uX2ctCUa3v5OXSfIm1rtd/yTzLh9APghh/F9S3Sm6bpOfhYI9aF/PGbdxFj8VhZOVzRylnSx2wfaM6pEYfboSAR4u0l2vbY2I75VWSjSkVCPReGn47dIZ3u2lwh/fmmdquvzdMZnVqQEvvRprlAxZWchR3z/XEOrquLXlpA8d1/hlTg7w9wGboOFDXxz8f2DhTUoP9fMhWiBzurzXyL8hlLxTqhayuf//kgF6/DYwTUDQxET7i35dUUSfd9urpiZJHGJBhV2fausNSPOZlI9r+oXjEBv0/n73x5iEobVrv/wWdOOX4SDW7b8FGwzGhnXV5DbB4CP00TK3Zd2U7e4qgn78tS3Rs2lRps71XvdEPNF/74+WMaFaCWXR3IuGXWRNnYvpt5EHPHRd49Y3QSCyC/85eea8blAJTLmjpc6zJOvynGoMBPqMVe587rBYSYfa2xpw9cH6Pit5UDBOTOOX9DWZZ3F+b/NKsc/vsjjjLCDm0d2R5i/h+TX3SxQCmd8hA/GSXywbcMedYbBKmttF/4QPw+M6xdk1u23GY1cjFZy+Qav7tcvpzlWtI3dDj7txEUueD2Ts8Fety9TbR6R4vvzJS7RcLCwBieK1VmB0lwF0W4mhP+6webDPN8cYJjHFi4/wXth1A1lDbmifuhvLosFPvb+Ebvr+GgdDzedLGGeM5WNQsVspc7dV1OJhsspLDct/D6enae6XjckzOw1Gd+3nYtP8Op+/Y/iNjIoq/k1q2DPsUq89GkuZ4G9bn9MJLw8XCW/rkhhnqsHBKNPhLQlGjbuUe+vIXPCH+LXedbOlKGmhT/7VC2Osf6+7cJ/UfLORY5f7A71R8+0t3cb99QPnAEOCr8ciJW7L30lTjXnq1fWtaC6vvM4f4jvlXtF4/sHo6eZMg10+/ZRUNZ4pfBfvusrGp/uK8Edq/fz23eAYF93zEqSvgSzoaweolSEBWQo0ZB6UvVjYijr3PUHd+L4bxre3ey1vqHw273OOrgQYBM1o6eDx97jIS3H3X4PWa4rUkG228f2gL+Xm6TX3PjTGdWPy9EztRga7W+V479zvOl5Vtd0HtszS7kY7eBic6WZUA9xnFtZgtkic8dLe3P88IfTaBWg/WTOmc5j8lEhl4Z0Bvf2Q1SIl8nrfLavBMzitI+LM3t0AJCRX82hJGbpHeqFay2k2NnDsaI6qwvpKZ1Ab3fMGCltKOy9XaeFGJuOPbbLibtsE9xSmIc9sB2jI3tT13EnIKQr3L5QufvJ0m7qthmN2JYhRljDlPB7uukQHfarw394eiyFX1bhb4/s6AAxa/QQaWGnLcvcPlbaMM+rJvqlqpFDhaaTR/p097nwq7KzmH8Hn+8vUU2fYVUIPx0/McfAXn4YEy99X92sk+ewN08M0yFH7+ENe84IM4eaW9uwP7/z77p/T18AwB0WsqHo9h2nI3tTd/G/EOJMt8/cfdMUVzUJs/fRganKotOGhQMAVtzWz4LwM5vHUTpMvo5DQSj8jiN17v6b/ysQbh6ZE35/bzeTdXuA9lTEokqWWXGUS2P8gufwE/sZ3ScQg6L8ZBEBc3FfNXHNwFDEdZe2Kc2GPeJ1hPv5hOlfMM9adPsM80gj/A2/Cj9z+Imz3f7mNObum+JgYQ2yT4kXfs001KCkuqnTx5ZMjTH72s8p/JLQkcuvu7wXIyGXCj9P61pC6jBPigAlGkyx047SHHuOVbIom5TiX9+Sq6uqY3oU6ZzJg0OhD/OS/Lp7jlWazOtWG3eO7wm/blKXaCgSdk59f8T2Ln8i7QUpw/W3QsdUTmLS7Y9mmMfZbv/bQ+U4XSHuJua3Wba3S9z0E4VfWuFvgY7xfWIK+U7rihHmCfXz4Oz4QwAAIABJREFUwM0jukt6zfd2nxZ6TuWcrkXOaet/7aUePosCM/X8ie1kFlRDV1VPx0+uZEZSBEL8pO+ruzP7LPJLxTAbd0/oKfk1Nwp0aMsUX9nQNpFuXybHz2Egnbr90XT7lrhjnPSVOOuazosv/DbU0//oxzNcjDKgu7grCyEA4OmuYxqnBQZF+WG0xGUsNu7RhrvdnlFqVZmYbRmlOFvbzAUpMQXljQz1kE7c/phIeLpL/2Pwm4Nlwmxc3jle2jBPm9GILenFmplj1nxWun15qKprYVYPuZI53NS1iNRhnje/KdTUHNuSRuHvUuHnMJCLCfXzkLyZyAXhFyTMc92QMMSES1uiQYT2ijaJj4VIw8afitDU2sYFKdPY0/ETp7j9L/aXorxGjHit1G6/uKoJqYfPamqezbRgLlh3X14Y4ydOEX5W4jRNyo6Tmptn0y2cf7h3UhSG6QO4IOVw/O0nd3lnJe3ow7wxeVCoLNcWRfjvntATPp6ukl5zo8Zy1UfEBiA+0sfi8/50Sx8uSjmEv54xfuIEt785rRg1gvx0l7q94qHCGmTka6v16dyrrMuImj06EtcNCeXClAEKP5Ff+AVx+90DPXGTxCUa3he8RENnzLva+m5lT8/uy4UpteOva2GMn7QzKMoPo/sESn7dlvNtwoR57rpKjhIN2grz3DW+J8L8rS8FMr5/MP50SzwXKB0/kQM5C7I1toiRlid5Jc6scuSVaqtI4ryJtvcm/uvt/TAilhu9FH4iOQzzmCdR749REv8i0prbHx4TgOuHhNn12pfvSeAipfATKRkbH4SEXtL31a1rPC/MaV2pc/cB7R3aWjS5t9nHX/3SYPKxiQkh+DNDPhR+ony3/3FaEdqMYnT2lDrMs/nnIlTUamd/LdjX3azwf/jDaTyUkoUTxaZbLP7l9n6ypRtT+AmFXyrhFyTMM2VoGPRh0pZo2KCx3P1Fk3vDVedi8vG3f+kzfN+bB81e5/X7BsNb4nMUFH6iOa4bEoreodL31a2obcGne0vo9juhzai9+P6iydEmH9ufX43/HWpvybgz+yxWfpZn8rl9I33w+m8Gc+FS+IlDbn90D1muK0rdfZ3ORfJDW+t2nBQmBGbtjTOuu+lfTG99d2nJikffy0baiSqTz58/sRcemhrDxUvhJ3YLP8M8Zrnrqp6Shxa00F7xErd/jenYfm1jK95KvbIk9e//c8jsNdcsGIhbRkVwAdsr/IHe7hwFjTJrVASCfaX//ourmvBlZpkQYyR1mKekuglfHijTzBwb3ScQkweb3pB9K/Ukmjo555GRX43FFsT/wyXD0a+HLxeyjQT6uEMX6OPGkaDblxRRcvd7BnfDjcPDJb2m1ko0WErhvDzMczFvfFOAdWYql3q46bDtiVFcyLYKv7c7Qz1axcvDVb6G6mnM3TeFljZ1uwd44jdmwjzbM0txqLDG7DUWrj2An45Xmnw8NtwbL909gAvaRhjq0bDbd3eT/r5fWN6A77LKhRgjqcM8WSfPmRUxuv3Omf9aJipNnHl49UsDHn3vCBe0LY7fx42OX6vcyk1dswyPCUBSnLQlGjZobFP3t9eaFv7cknqr58qxojrMfz3ziv/+/NYTeCgli4vZLsfvQ8evNcL8PSx2QLKXzYKEeW6XpUSDdsI8C5OjEBVi+nzI26m2NZf/bF/JJZu9f/pvDp74MIeL2R7H7+0ON6lPJBLtuv0TxXXYnVNB4e+E3TkVyDldq5k59vvros0+bm2Y52Le+KYA/Xv4IrekzmxdH2Iefbg3mNKjQeaMkefQligF2W5IDEO0xKeZteT2pwwNM1vJdP3OUyipbrLr2kvXH+YClgBdgDfrXmiJ2HBvTBoYIsu1RUnjlPqkLqCtQ1uW3X4hF2IXEujtzhi/9ty+PGGe7FPnkJZbpfrx8XDTSR7m+Xx/CYqqmjQxv4ZE+2NmkukTtT8eq8QuQcKBaiXA2xU6xvgp/FIgUt19Lw+pSzRoJ8xjye2/8XUBF2EXow/zZh6/lhjS21/yFMVfhV+QMI/Ebt9o1E58P8zfA7+/1rTw55bU491dp7gQu5hAH3fo9OFeHAm6fYfIMNTgQEGN6scnKsQL04ZJW6Lhg92n0dB8XjNu38XFjNv/hm5fEcLv7Q5doLd7HIeCwu8Im+n2TbLhJ27qAkBd03m88Y2Bi1AB6MO9oAvy9cjjUIjPuH5BGNBTnkqGDPN0TmlNkzDNaCxx3zW90SOom8nH135dgNrG81yIynD8cTqgPeZDxGa2TAXZfj5RhSMCHEwaEu2PkbEBkl5TS5u6i6+3sKlLt68Mtx/mjSBfjzwdACRG+3NEBGfOaIZ5zN8YpW/qoZVN3VtGRWB4jOmb5nu7TiO3pJ6LUAlu/5cy/Dqg/QgvEZfJg+TpqwuIE+aZPUraG+OxojrszD6rifn1wA3m2yCupdtXjvD/ksWpu/hfiJjIFebZlVMhhJNLigvEwCg/id2+NjZ1Jw8KNXsS/JuD5fjxaCUXoUJI1Af8KvxDo/04IgLDvrrOvzFqJb7/wA16s48ztq8sOkr0cHNXcG4a3h1h/h6yXHuzIKd1pY7vp+dWCXGuwRIjYwPMlmc4VFgjTJluIR1/ckIIc/kFRY5NSwD49lA5Tp5tUP34jO8fjD4RPnT7dvAHi7F9HthSGh0lenQAwFx+MXFxAWbLFeZJY5jHFFo4tNUnwgcLJvYy+XhRZSPWsi6P4rgkq+fiOwERye1Hwq+bPC0XPkkX42DSLaOk/UX0XVY5CsoahJ9blmL7r7BRiiLdfky4j8tlws+aPSIKvxx8m1WOM5WNqh8fOdJcRalSao4wfw88MMW08NfUt+LV7flcgIoT/l/n+gXh7wj6EzFwcQFulqmv7ifpYoibHNlOm9PEj+8/cIMerjoXM24/H3VNLM+gNC7W+AvCPzEhmCMjEDeP6A5vT3m6q20VJMwjtfBvzyxFseANV3w8XbFkaqzJx1vbjHT7CuXitH3G+AVl+kh5snl2ZJ8VIptnxsgIhPpJm+aqhTDPshtjEeBtet/o1e35KK1p5gJUIBen7V8c42dKp2COXw4Y5jGNKHWLTNHNXYdlN8aafc4r2w1cfAolUe9/pfAH+Xrk0fWLwbWDQ2U7tCVCmMfTXYdbJRb+renFqKxrEd7tB/uaPuz5r/8VwlDGYmxK5OKMnkuEHwCSzdTcIOphukxuf3dOhRALe86YSHi66yR2+2KHedxdrXD7XzK2r1zhvzR77ZLZHx3ajSMkADePlEf4twoS5rlV4jTX1vNGYQ60mXb7MWZ/Rb6/6zQOnzzHxadQLs/a1Jl7kKiPsX2DZNuoFyHME+LngRlJ0m58b04rQr3A6Ys6Fxe6fZVzedbmpaEe1uxRPXKFeTINNcgtqVO/25dhU/fzfaXCu/2IQE+Tj29JL0baiSouPkU7fn/Tws8NXvVzQ2K4LNf96oAY4iaH8H+2X+y+uhbd/ja6fSUT6ON+ycbuFcIPcINXzUSHeWGYXp42ml8dKFP9+MRH+uCaQaGSXnN7ZimqBM7mWTotBj2DTe/9fbavBDs00mlMrSQnXKnpVwg/N3jVy5QhYbJct6K2BamH1b+47xjXQ3q3v0/bbv8fn7Owr9LpLIpzhfBzg1e9XD9UHuEXwe1T+G3nkemxZovY0e2rg87K8eg6+VnADV4K/2XCr/74/oQBwUjoJW2L0V05FTh1tlHIueThpsOj0+Po9gUgsZPw7xXCH+TrkddZTIgom8mDQ2WrvS+C46fbt43Hbo5DeIAn3b4Aon/5xm6nwt/+ZIZ71IZc8f0fj1UKUXHyjnE9Jb/m54IKv7+XGx69mW5fBJITOk9m6FT4WaJZfcgW5slUf5jntrGRZmvM2EOmoQZHTtcKOZcevTkO/l5udPsCYErLdZ3fJRjnVxMx4d4YGi1PGueXAoR5bpfB7W/LEPPQVniAJx6j2xeGRBPp3Z0Kf5CvR16iTPngRI67ujx7MqXVTao/kRnu7yl5X932G6KYwv/o9Dh4uOno9gUR/c7i+yaFHwBmyFToi0jP1QPkCc19J0Du/p3jpd/ULatpxq4jFcLNo96hXnhkOvP2RcFUfN+s8Jt7EVEWE/rLI/ypWeWqH5t5V/eS3u1niun2LYV46PbVFgkItl34Jw0Kdbm4VRdRJjHh3ugT4UPHb+KX0LAY6TPURDnQdjEDevriD1P0Zp/z960nuOBUQqCPu9m9WrPdKGYmRXAEle72ZQrzHCuqw4lidVfjvEcGt9/u+MUT/idnxZt9fN2Ok9hzrJILTiUkJ4QgyNcjzy7hnziAaZ2Kd7UyhXm+U3mYx6ebqyxhnp3ZZ3G2Vqxm4hP6B+PuCeYzn/5Gt68qhkabP6VuyfEzrVPxjl+ejB61F2VbMDHKbHYK3b71bv/lz/NwvKiOi01N8z85yn7hZ31+ZRMd5oW+kfLE91MPq9vx3zspSpbripbGOWtUBG5INH3471xDK/625TgXm4owl8ZplfADwPyJPTmSiv2JLo/bT8utQlmNesMZ1wwKxXAZNnXzS+uRaagRzO33Mfv437aeQEVtCxebirAmI9Oi8C+dFstwj0IZ1UeemkqpWeoO89ybLI/bFy13f9Hk3hgZG2jycUNZPZ5nbF91WHMGy6LwM9yjXMwtWocELke9wh8Z1A13TZDnV+r3OWLlsFt0+1so+mpDH+aNSYNCXRwWfoBpnYoV/jh5hF/NaXvv3J8o27W/F8jxPzGzD8wZun151fj3t4VcZCrDWq22SviXTNNzRBUo+u6uLpJf91DhOdXGdMP9PTCuf5As1zaU1QuT2RLi52GF2+eGrhqxtrKyVcIfE+7jwnCPskiKlSe+r2a3/6db4uHt4Uq3b4GnZ8fD10zTnu2ZpdicVsxFpjICfdwxa1SkVW7Q6kRnhnuU5/hlEf7j6hT+QVF+eGhqjGzXF0X4R8QGWBynFZuOcYGpkAUTrU9qsFr4l8+JZ3aPkoSfjv8SLB1Cclz4xdjYfWZOX7OPv/aVAT8fr+ICUyG2VFS2WviZ3aMcfDxdMUSGxivFVU04ekZ9XaWuGRiKuVf1kO36osT354yJxE0jTItDTUMr3b5KSdT7W5XNY7PwA9zkVc6XTLd/idu/pY+s1z/fJsa8seT2V2w6puqDe3T71mOT8C+YGMVwjwJI6OUrj/CrML5/1/iemDxI3t4Rq7epv/nIYzfHYWCU6cJdmYYaNllRMQtsPLRok/AH+XrkLZDpVCSxRfj96Ph/4anZ8bL/jfRcdce8uwd6YrkVbp+ok5lJERZr8zgk/ABLNYvs+PeqTOAenxGHfj18Zf0b59uM2Jtbrer58sycvvD2NJ3mujmtGFvTmb6pVuxpk2uz8C+c1Js5/V0t/D2ld/yHCs+hsUU9wewwfw/8+Za+TnH759uMqp0rY+OD8Pvros27/Y10+2ol0MfdrvL5dhUsZ05/1xHk445eId0kv25mgbpc7VOz+8K3m6vsfydd5W7/ubn9zT6+8rNcHCys4cJSKTOTIsx22pJU+JnT34VuX6b4vprKDY+JD8KDN+hNPi5lFc29Ko7vP3iDHpMGmi7dfbqikbF9lTPfzi5zdgl/kK9HXnJCCEe9S4Rfnpi2moT/bxZc7A1//1lCx69O4e8Z3A1/v3OA2ec88UEOahvPc1GplOSEEJty9x0WfgCYP7EXR74LkKvjVqZBHSGN+68372J/88YBxEdIM0aVtS04crpWlfPk73f2h4+ZDd2Pfy7Cu7tOcUGp2e07oMF2Cz83ebuGHkHSx/dzS+pVUZEz3N8Tz83tZ/LxI6dr8XbqSYT4eUjy9/Yb1BnfnzUqAvdMMC0K59uM+OMHOVxMKsbeTV2Hhb/9jsO2jCIIv1rc/nNz+yHQ293k47/910EAgK+nNJu+R06p1O1bCIX98YMcnChm83Q1s2Sq3q5NXUmEn20ZRRF+5cf3pyaG475rept8/I1vCrA7p31TN8DHXRrhV2GY5+9z+5s92/DD0Qqs/CyXC0nlbt/Rg7QOCT9P8jqfyGBPTQr/83eZdrHnGlqx/KJcdHO/CmwT/nOqmhtJcYH440zzdYsef58hHrWTnBBi80ldSYUfAFbNS6DrdxL+3m7wM9NAw15yFF6R89nb+mFIb9PVSJ/4MAel1U0XOSJpxkhtjv/Fu81n8az8LBc/HK3gQlI5SyToO+Gw8Af5euTxQJdzkCPM09TSpuh474jYALP1eL47XI7XvjJc+lNYAsdfVtOM4qom1cyNx2f0gbkU6xPFddzQFYCZSRF2p3BKKvwALBaAIsoVfqW7/RfuMu9in+xEzLwl2NzNVlGYJ1Hvj+fvtLyhq+bSE0Q6ty+Z8A+LCXBJ1PvzW5GZQG8ZwjwKDmcsnRZjtuTyi5/m4ucTVx6w6ubu+LRWU0bPy/ckmH38X98W4uOfi7iAVI6tzVZkF366fufg7amd+H6i3h+r5g80+fiJ4jo8+WHnoYtuEjRcz1FJfP/Rm+NwjZmbY35pPZatP8zFQ7cvj/DPGhXJA10y4+MpfVEypQrcKwsHmX38yQ9Nhy6kcPxnKhsVPx+G9PbHixZCYcveyUZ9E8syqB19mLdDB7ZkE34AWDU/gd+QrI5fBuFXoOP/y+39MKG/6b4PH/5wGht/Mh266Obu+DidqVT+xu7L88yvt9e+MuAT1tkXguVz4h06sCWr8NP1yyz8HuI7/msHh+LPt5jO4qmobcHD7x4xe41uHo5P6yKFO/6Hb4rFtYNNh3iOFdUxxEO37xzhp+tXl+PPL61XVPMVH09X/PNe8yGeR97NtijKXoKHeq7qF4yVFjZ0l60/jJbzzOKh23eS8M8aFckMH5UIf2F5g6I+3xuLhpgtN/DRnjNI2XHS4nUc3dwtP9es2G5kbq4uWHvfYLPPWb0tH9sySrlg6PadJ/ztdyhm+KiBAgUJ/5KpMbh7gumif9X1rXj4nWyrruXh5ti0VnKYZ+19gzG4t+lmPIdPnmOIh26/a4Sfrl8eahtbhXT84/oGYfWCgWaf8/C72Thd0eiUcVLqxu5vr+1ttlAdADyYksWFIgjJCSFYOKm3ixzX1sn1plMWJ/Kbo/BbxNNdh7WLzIcuNv5UhLe+K7RhnBxLX1Rib4LhMQF4Y9EQs8957P0jSD18lgtFGLcvX+RENuEfFhPgwho+Ugu/tPnYJdVd72z/87shZguwFVU14cG3s2wcJ8dukC3nlRfff2PRYJizfhv2FOGlT1luWRSkqsnjdOFvd/1DWblTwY6/pLq5Sz/Po9PjcPcE8+3jHnw7y+Yb1DmHhV9Z2TBZKyciKS7Q5OP5pfX4/b8PcoEIhJSndJ0u/KzXr2zHX9qFjn/K0DCLZYRXb8u3q8aMo+PU0qocx7/sxlgMjPIz+5xFbx5EZV0LF4ggLJ0WK6vbl134gfZ6/YESdUSi8Evt+LtG+KNCvfCf3w01+5y9edV2Z6fUCuL4p4/ojn9YOJ378DvZ+DarnItDEAJ93LFkml72vyO78Af5euStmsdDXUpz/C3n27qshssHDw5DrxDzJaYfeOtQl90gleD4+/f0xfo/mE+QWL/zFP7xRR4XhkAsmap3uLuWIoQfABZO6s1SDhIgZcOU6vrWLvkM7z80DOPN1OEBgIdSDndabtlarE37VKrj93TT4d0HhiHIzC/lTEMNFr15gItCIPRh3k7rY65z1odKWTyU36yDlFQ34ew5aTZka7pA+J+/cwDuvKqn2ee89V0hXv0y36G/k1dS7+A77Vrhf+eBYRgZG2Dy8dY2I37zxgGWZBCMVfMTZDms1aXCP2lQKNM7JeDoGWlcf22Tc4V/6bQYPD7DvJnZm1uFRW86np2S66Dwy9H3wFpeuGsAbhsbafY5v3njAPbnV3MxCMTMpAjMGhXp4qy/p3Pmh2N6pxTCL001zZZW57nF+67pbbapSvv7acN9bx6UxGvnl9Y71GZQjr4H1vDkrD547GbzS2TlZ7l4Z+cpLgSBCPRxd3qZG6cKf5CvRx5DPg4Kf5FEwu+kQ0p3jOuBf/9uiOWbw5sHcaCgRrK/64jr9+4C4f/DFD2eu8N839xP9hbj0feOcBEIxpKpegyLCXBx5t/UOftDLpzUm3V8HHL80oR6mp3g+G8e2R0fLhlu8Xl/33oC73wvrYvNLbF/nPRhXs5dE8lRFstRp52owtw1GVwAgpGo93fahm6XCj8AbHlkJL9xO5GqY5a3h7xf/c0ju+OTR5MsPm/DnjMme+c6giMbvHHdfZz2fd49oSfetvAr+OTZBsxdsx8NzWyhKBqr5g102oZulwt/TLiPy9JpsfzW7RH+07WSFFfz9ZJvA9Na0d+XV415r2XK8h72HKu0+7Vh/h5wxqHDu8b3xLsPDLPwy6wNc9dkIK+0npNfMJxxQldRwg8AqxcMZG6/nezIdrwCo183eYR/zphIq0S/ur4F81/LRJNMDU9+dED4AWDyoFBZv8MHpujx3oPDLD7v1lX78MPRCk56wdCHeWP5nPguS3bRdeWH50avfeyUQPh7BneTfBPzgRv02LhshFXPvfOVDBw+dU62McovrXeo0cy0YeGyvbenZsfjVQsxfQBYuPYAPt1bwgkvIM7M2Vec8E8aFMqQjx1s/rlYkuvER0gXy/7rHf3w6sJBVj33nn9mOqU14HYH/oZcwv/v3w3Bs7f1s/i8h9/Nxjor2kwS9bF0WqxTc/YVJ/wAQz72UFXfgq3pjou/uVK/1uLn5YaPlg7Hn2bFW/X8JesO471dzslD355pv/BHBHriD1P0kr2X3qFe+OpPoy120AKAP35wBP/4nDV4RKSrQzyKEX4ASF0+hjPCRjb9VOTwNa4eEOzQ68f3D0ba38bjtrE9rHr+ik3H8Mr2fKeN0baMUtQ5UIjuwRukEf5bRkdi798n4PohYRaf+9RHR/HCJ2yoIiopi4d2aYhHUcLPLB/beX/3aYebpd8+rge6B3ja9dqn5/TFrhXj0L+Hr1XPf37rCTyz8ZhTx6j1vNGhcEm/Hr54yULPAHME+bjj9d8Mxsf/NwJh/h6Wx3TDUfx183FObkHpyiweRQo/0B7y4cEu2/j3/woder2Hmw5PzOxj02uuHxKGvX+fgBW3Wn/E/PmtJ/CEDLn61uBonPyR6XG4e0JPm1/3hyl6HF09CYuvj7bu77ybjb98TNEXlUS9vyJCPB24KGlwKmubY4Pu/Yq/c63Ez8sNBa9NNlu+1xqe23Icf/7vUbPPuWl4dyydFoPJg21Lc+xK0e/g08eSMH1Ed4eusXzjMTy7yfwvlt6hXpg9OhIP3KBHbLj1+1Z/eOsQXv+6gBNaUAJ93JH69Finl2VQjfADwJa0IuOslXs5W2xwpI6EIzrIOV2LjT8VYVdOBcpqmtDN3RU9gjwxrl8wZo+OgD0b8NaIpTO4ql8wdj87zuHrnKpoxJvfFODwqXPILa6Hl4cOwb4eGNs3CFcPCMbEhBCbrtdmNGLumgxs2HOGE1lgVs1PwLIb4xSltS5KHKiZL6Ubpcha0QoHX5qIwb39FPWe7v/PIaz9Rjku9p0HEnGPhcbuzuRURSPmrtmP3Tk8nCUyC5KjsO7+RMXprE6Jg5WyeGgc4/02iKwDbQql5nybEXP+sU9Rog8Aj713BFUKaUieevgsrl7+I0VfcPRh3lg1L0GRpegVKfxBvh55LORmPbtzKvDIu9ld/j4y8qsx6snd+PjnIsWNUXFVkyJKGr/6pQHXPLsH+ay9IzSBPu6KSd1UjfAD7SmeFH/refnzPLzchYd+UnacRNKTuxXdGeo/3xV22RjVNrbi3jcO4KGULE5WDbB8TrxiUjc7w0XpA7jg9Uwjj65bz9uLh2JhcpTT/l5zaxuWrc/G618bVDNGHy4ZjjvG9XDa3/t8fwkeSjlMl68Rlk6LxeoFAxWtrS5qGMjEx3YaMw01nFFW8vydAyz2t5WCLzJKsWz9YRwvqlPdGKXcn4gFE+Xd7C2vacaT/83Bv78t5KTUCIl6f6Q+PTZOqSEeVQl/ZW1z7LDHd+UayuiYrOXeSVH4x7yBCPCWvvzyieI6/H3rCbydqu5fYs/e1g9PzY6X5dqvfWXAUx8dRaVCNpSJ/AT6uCPjhQmICfdRvK66qGVQM/KrjcMe/56zywZ6BXfD83cNwF3je0pyPUNZA177Kh8rPxOngNjVA0Lw7G19bc7BN8U735/CC5+cQPapWk5AjYl+yuKhXV51UzjhB3i4y14G9PTFAzfEYFZSBCKDbK/N82VmGd7eUYiNe4qEHaOpw8Kx+Lpou074niiuw/u7TyMl9aTD9ZOIOlHiIS1hhB/gZq+jTEwIwdUDgpGoD8DQaH+E+XvAr5sbXFyAlvNGVNW1IOd0LQ6dPIefjlfis30lisl/dwZBvu6YlRSBEbEBGKYPQHykD/y83ODp1p4AV9PQilNnG3CgoAYZhhp8mVmGQ4Xcf9IyatjMVb3wAzzZKwe+3VxR28hm3qbwdNehpdWINqORg0F+NaLJUVg1L0Hxm7lCCD/ATB9CSBdrkEoyeDpDp9ZBT316bBw7dxFCugJ9mDe2PDISahR9VQt/kK9HXuryMQh0sCQxIYTYQkcGjxrSNoUTfuCXsg4Ps6wDIcS5oq/kcgzCCz8ATBoU6pL69FjOSEKI7Kyal6CaXH2hhb9D/FnQjRAiq+jPT8DCSb1dRPgsOlG+lFmjIl1WzU/g7CSESM7SabGqOqClGeEHgGU3xrksnRbLWUoIkVT01XZAyxIuIn5RPN1LCKHoa8Txd7Du/kSXBU6sSU8IEVP0l8+JjxPxs7mI/MXR+RNCHBF9tR7Q0rTwU/wJIRR9DQo/xZ8QQtG/FJ0Wvsx19ycy24cQQtHXkuO/8MWuO2xcvS2PM5wQcoXoi5i9o2nH38HqBQNdls+J5ywnhFxg+Zx4TYm+5hx/BymphcaFaw9wxhOicdTWMpHC7yCpWeXGSc+psPfzAAAEOklEQVTu4cwnRIME+rhj1Txxau9Q+G0gI7/aOOzx77kKCNGY6KcsHipElU0KvwPiP2vlXhjK6rkiCNGA6G95eKTq6+lT+CWgsrY5dtKze3LZw5cQcUnU+2PLIyNV3TmLwi8DM19KN25NL+ZAECIYyQkh2PLISE3k6FP47YC5/oQItqY1dDCLwu8Aq77INS5bn82BIETFBPq4Y/mceE2ma1L47SQjv9o46dk9qKpr4WAQokLR13rmDoXfTrjpS4j64CYuhV8SGPcnRCVrlfF8Cr+UsMwDIcqF8XwKv2zwsBchyiNR749V8wZq/lAWhV9m2NiFEGXA/HwKv1Nh6IeQroOhHQp/l5GRX21cuDYTzPohxHkk6v2RsjgRw2ICqF8U/q5j+YYc44pNxzkQhMjs8hdMjGLWDoVfWe6fG7+EyOfyl8/pywNZFH5lwpx/QqRlQXIUVs1LoMun8NP9E0KXTyj8dP+E0OUTCj/dPyF0+YTC32Ww1DMhpunIy18wMYoun8IvFpW1zbHL3snO5alfQn4lOSEEKfcPZTVNCr/YMPxDCMM6FH6NwvAP0SIM61D4NQ/DP0RLgj8zKQLL58QzrEPhJ0B7+GfN9nzwBkBEJDkhBKvmD2R9HQo/6YzUrHLjsncOs/AbEUbwl8/py1r5FH5iDVvSiozL1mdzA5iokkS9P+ZP7MWyyRR+Yg8pqYXGFZuO8wZAVCX43Lil8BPeAAgFn1D4ib0wBESURHJCCGYkdafgU/iJM0jNKjeu//4Us4BIlwk+N20p/KSLYBoocRaBPu5IjPZnWiaFnyiJVV/kGldsOo6quhYOBpFU8JdM1WNBchQPXlH4iVJJSS00rt95Cjuyz3IwiN0wfk/hJyqEYSBij7ufmRSBJVNjGM6h8BO1syWtyLhmWz5/BRC6e0Lh1xr5pXXGrenFWLPNwJRQjZOo98eMkd0xMymS7p7CT7RCala5cUd2OdbvPM2bgEYI9HHHgolRmD+xF8Wewk+0zpa0ImOmoZo3AcHFXh/mxVAOofAT078EPtlbwiqhKuXiMA7FnlD4iU1U1jbHrtt5MveT9BJuDCvc1SdG+2NiQjBj9oTCT6SlIyTEXwPKcPXJCaGYMbI7EvX+dPWEwk+ceyPYmV3BXwQyO3p9mBeFnlD4ibJvBJkFNSwf4YDQd4RukhNCKfSEwk/UQ35pnTHTUAPeDCyLfKI+ABMTgqEP82aMnlD4iVhU1jbH7sg+m2soq0dBWSMyDdUwlDUIn0Z6scBHh3VDYnQA9OFeLHxGKPxE26RmlRur6luQaahGQXkjDKXtNwM17B90xOH1Yd7Qh3kjwNsVyQmhHf+doRpC4SfEHvJL64yG0gZU1begqq7lwq+EgvJGVNW1XAgjtT/eetE/WxdeCvRxb/9/b3cE+rhd9M+//M/bHdFh3QAAidEBF55PYSdq4v8BYLK1n8lpIOIAAAAASUVORK5CYII=";

// Passwords for the welcome screen (normalized: lowercase, no spaces)
const ACCEPTABLE_PASSWORDS_NORMALIZED = [
    "westpier", // for "West Pier" or "WestPier"
    "goodlaw"   // for "Goodlaw"
    // Add more acceptable normalized passwords here, e.g., "anotherpassword"
];

// const LOGO_BASE64 = "data:image/png;base64, ... [YOUR ACTUAL BASE64 STRING HERE] ... ";
// IMPORTANT: Make sure you have the actual LOGO_BASE64 constant defined in your file
// if you need it for the PDF generation, even though I'm not outputting the long string here.
// The script.js for PDF generation will look for this constant.

// --- NARRATIVE TEMPLATES (For Woodruff Billing's internal narrative compilation from solicitor's PDF data) ---
// Placeholders: {UPLIFT_PERCENT}, {ITEM_OF_WORK}, {FEE_EARNER_NAME}, {PANEL_NAME}, {USER_EXPLANATION}
// {ITEM_OF_WORK} will be: formData.caseDetails.matterType + ": " + formData.caseDetails.caseMatterName
// {USER_EXPLANATION} will be replaced by the solicitor's text, formatted as a blockquote.
const NARRATIVE_TEMPLATES = {
    "intro": "An enhancement of {UPLIFT_PERCENT}% is claimed on the {ITEM_OF_WORK} work due to the following exceptional factors, reflecting the principles in CPR 44.4(3) and relevant LAA Costs Assessment Guidance (CAG) and the 2018 Standard Civil Contract Specification (referred to as 'Spec'):\n\n",
    "panel_membership": "**Panel Membership (CAG Section 12.20-12.23):**\nA minimum enhancement of 15% is claimed as the fee earner ({FEE_EARNER_NAME}) is a member of the {PANEL_NAME}, and the work undertaken falls within the scope of this accreditation. This is a guaranteed minimum enhancement.",
    "threshold_intro_narrative": "\n**LAA Threshold Test (Qualifying for Enhancement - Spec Para 6.13 / CAG Section 12.4):**\nThe work meets the threshold for enhancement because:",
    "s1_competence_skill_expertise_header_narrative": "  The work was done with **exceptional competence, skill, or expertise** (Spec Para 6.13(a) / CAG Section 12.8.1) as evidenced by:",
    "s1_cse_detailed_knowledge": "    - Unusually detailed knowledge relevant to [SPECIFY AREA OF KNOWLEDGE/CASE ASPECT] was demonstrated and applied.{USER_EXPLANATION}",
    "s1_cse_difficult_argument": "    - A [UNUSUAL/DIFFICULT] legal argument concerning [SPECIFY ARGUMENT] was skilfully pursued.{USER_EXPLANATION}",
    "s1_cse_marshalling_evidence": "    - Unusual skill was shown in identifying and marshalling complex/ voluminous evidence relating to [SPECIFY EVIDENCE].{USER_EXPLANATION}",
    "s1_cse_effective_tactic": "    - A particularly effective tactic ([SPECIFY TACTIC]) was identified and implemented, significantly benefiting the client's case.{USER_EXPLANATION}",
    "s1_cse_less_time": "    - The work was completed in significantly less time than reasonably expected due to exceptional efficiency/expertise in [SPECIFY TASK].{USER_EXPLANATION}",
    "s1_cse_better_result": "    - A better result ([SPECIFY RESULT]) was achieved than might usually have been expected, directly attributable to the exceptional skill applied.{USER_EXPLANATION}",
    "s1_cse_vulnerable_client": "    - Exceptional skill was required and demonstrated in taking instructions from and/or providing effective representation for a client who was [A CHILD/SERIOUSLY MENTALLY ILL/OTHERWISE VERY VULNERABLE - SPECIFY], requiring [SPECIFY ADAPTATIONS].{USER_EXPLANATION}",
    "s1_exceptional_speed_header_narrative": "  The work was done with **exceptional speed** (Spec Para 6.13(b) / CAG Section 12.8.2) as evidenced by:",
    "s1_speed_proactive_pursuit": "    - The case was proactively pursued, resulting in [OBTAINING RE-HOUSING/INJUNCTION/ETC.] with unusual speed.{USER_EXPLANATION}",
    "s1_speed_urgent_deadlines": "    - Substantial work was necessarily undertaken at very short notice ([SPECIFY TIMEFRAME]) due to urgent and unavoidable deadlines concerning [SPECIFY URGENT MATTER].{USER_EXPLANATION}",
    "s1_exceptional_circumstances_complexity_header_narrative": "  The case involved **exceptional circumstances, novelty, weight, or complexity** (Spec Para 6.13(c) / CAG Section 12.8.3) as evidenced by:",
    "s1_circ_legal_issues": "    - Complex legal issues arose concerning [SPECIFY LEGAL ISSUES].{USER_EXPLANATION}",
    "s1_circ_expert_evidence": "    - Complex questions of expert evidence from [NUMBER] experts in [FIELD(S)] required careful analysis.{USER_EXPLANATION}",
    "s1_circ_evidential_issues": "    - Significant evidential issues, such as [SEEKING/CHALLENGING EVIDENCE/TRACING ASSETS], added to the complexity.{USER_EXPLANATION}",
    "s1_circ_difficult_instructions": "    - Difficulty in taking instructions from the client or key witnesses due to [LANGUAGE BARRIERS/TRAUMA/ETC.] required specialist handling.{USER_EXPLANATION}",
    "s1_circ_client_impact": "    - The nature of the issues had an exceptional impact on the client, involving [LIBERTY/RIGHT TO REMAIN/HOUSING SECURITY/ETC.].{USER_EXPLANATION}",
    "s1_circ_out_of_hours": "    - Substantial and unavoidable out-of-hours work was required on [SPECIFIC DATES/NATURE OF WORK].{USER_EXPLANATION}",
    "s1_circ_novelty": "    - The case presented novel points of law or a unique factual matrix concerning [SPECIFY NOVEL ASPECTS].{USER_EXPLANATION}",
    "s1_circ_weight_volume": "    - The sheer volume of documentation ([APPROX PAGES/FILES]) or number of distinct issues ([NUMBER]) constituted exceptional weight.{USER_EXPLANATION}",
    "stage2_intro_narrative": "\n**Determining the Level of Enhancement (Justifying the % - Spec Para 6.15 / CAG Section 12.5 & 12.9):**\nOnce the threshold test is met, the level of enhancement is justified by the following factors:",
    "s2_responsibility_header_narrative": "  **Degree of Responsibility accepted by the fee earner** (CAG 12.9(a)):",
    "s2_resp_no_counsel_analysis": "    - Significant analytical and case planning work was undertaken without recourse to Counsel.{USER_EXPLANATION}",
    "s2_resp_no_counsel_drafting": "    - Complex drafting ([SPECIFY DOCUMENTS]) was undertaken without recourse to Counsel.{USER_EXPLANATION}",
    "s2_resp_no_counsel_advocacy": "    - Advocacy in [SPECIFY HEARINGS] was undertaken without recourse to Counsel.{USER_EXPLANATION}",
    "s2_resp_addressed_expert_issues": "    - The fee earner addressed complex evidential/expert issues ([SPECIFY]) that might otherwise have required separate expert instruction.{USER_EXPLANATION}",
    "s2_care_speed_economy_header_narrative": "  **Care, speed, and economy** (CAG 12.9(b)):",
    "s2_cse_care_skill": "    - Exceptional care and skill were demonstrated in the overall management and presentation of the case, particularly in [SPECIFY ASPECT].{USER_EXPLANATION}",
    "s2_cse_care_vulnerable_client": "    - Particular care was taken in dealing with a vulnerable client, demonstrating [EMPATHY/PATIENCE/ADAPTED TECHNIQUES].{USER_EXPLANATION}",
    "s2_cse_speed": "    - (As detailed in Stage 1, if applicable) The work was conducted with exceptional speed.{USER_EXPLANATION}",
    "s2_cse_economy_efficiency": "    - The case was handled with exceptional economy, resulting in [LESS TIME CLAIMED/FEWER DISBURSEMENTS] due to [EFFICIENT PLANNING/EFFECTIVE STRATEGY].{USER_EXPLANATION}",
    "s2_novelty_weight_complexity_header_narrative": "  **Novelty, weight, and complexity of the case** (CAG 12.9(c)):",
    "s2_nwc_novelty_law": "    - (As detailed in Stage 1, if applicable) The case involved novel points of law or legal context.{USER_EXPLANATION}",
    "s2_nwc_weight_docs_issues": "    - (As detailed in Stage 1, if applicable) The case involved exceptional weight (documentation/number or importance of issues).{USER_EXPLANATION}",
    "s2_nwc_complexity_overall": "    - (As detailed in Stage 1, if applicable) The overall complexity of the legal and factual matrix was exceptional.{USER_EXPLANATION}",
    "conclusion": "\nThese factors, individually and/or cumulatively, rendered the work exceptionally demanding and/or required exceptional skill/responsibility beyond that normally expected for a fee earner of this level, justifying the enhancement claimed. Evidence supporting these assertions can be found within the case file."
};

// --- QUESTION FLOW AND STRUCTURE (For building the solicitor-facing form) ---
const QUESTION_BLOCKS = [
    // PAGE 1 Content Block (Panel Membership)
    {
        page: 1,
        id: "panel",
        title: "Family Panel Membership",
        checkboxes: [
            { label: "Fee earner is on Resolution Accredited Specialist Panel", key: "panel_membership_resolution", explanation: false },
            { label: "Fee earner is on Law Society Children Panel (and work relates to children)", key: "panel_membership_children", explanation: false },
            { label: "Fee earner is on Law Society Family Law Panel Advanced", key: "panel_membership_advanced", explanation: false },
        ],
        columns_for_sub_options: 1
    },
    // PAGE 2 Content Blocks (Stage 1)
    {
        page: 2,
        id: "s1_competence",
        title: "LAA Threshold Test: Exceptional Competence, Skill, or Expertise",
        main_question_text: "Did the work involve exceptional competence, skill, or expertise?",
        main_toggle_id: "s1_competence_main_toggle",
        narrative_header_key: "s1_competence_skill_expertise_header_narrative",
        checkboxes: [
            { label: "Unusually detailed knowledge demonstrated", key: "s1_cse_detailed_knowledge", explanation: true, placeholder_example: "e.g., An exceptional understanding of [obscure case law/specific local authority policy] regarding [topic] was crucial because..." },
            { label: "Unusual/difficult legal argument skilfully pursued", key: "s1_cse_difficult_argument", explanation: true, placeholder_example: "e.g., We successfully advanced a novel interpretation of [Section X of Act Y / established precedent] concerning [the argument point], which was pivotal as..." },
            { label: "Unusual skill in marshalling evidence", key: "s1_cse_marshalling_evidence", explanation: true, placeholder_example: "e.g., The case required collating and analysing over [number] pages of [type of evidence, e.g., medical records/financial statements] to distil key facts about..." },
            { label: "Particularly effective tactic identified/implemented", key: "s1_cse_effective_tactic", explanation: true, placeholder_example: "e.g., Instead of [standard approach], we strategically opted for [specific tactic, e.g., an early without prejudice offer / a specific type of application], which led to..." },
            { label: "Work completed in significantly less time", key: "s1_cse_less_time", explanation: true, placeholder_example: "e.g., Due to prior expertise in [similar complex cases/specific procedure], the [specific task, e.g., drafting of the complex Scott Schedule] was completed in approximately [X] hours less than typically expected for..." },
            { label: "Better result achieved than usually expected", key: "s1_cse_better_result", explanation: true, placeholder_example: "e.g., The outcome achieved, namely [specific positive outcome, e.g., a more favourable contact arrangement / a higher financial settlement than initially proposed], exceeded typical expectations because..." },
            { label: "Exceptional skill with vulnerable client", key: "s1_cse_vulnerable_client", explanation: true, placeholder_example: "e.g., Dealing with a client who [specific vulnerability, e.g., had severe anxiety / was a non-English speaker requiring an interpreter for every meeting] necessitated [specific adaptations, e.g., shorter, more frequent meetings / using visual aids] to ensure effective instructions..." },
        ],
        columns_for_sub_options: 1
    },
    {
        page: 2,
        id: "s1_speed",
        title: "LAA Threshold Test: Exceptional Speed",
        main_question_text: "Was the work done with exceptional speed?",
        main_toggle_id: "s1_speed_main_toggle",
        narrative_header_key: "s1_exceptional_speed_header_narrative",
        checkboxes: [
            { label: "Case proactively pursued (e.g., rapid re-housing, injunction)", key: "s1_speed_proactive_pursuit", explanation: true, placeholder_example: "e.g., Given the imminent risk of [e.g., eviction/child removal], we proactively [action, e.g., issued an emergency application] within [timeframe, e.g., 24 hours of instruction], resulting in..." },
            { label: "Substantial work at very short notice for urgent deadlines", key: "s1_speed_urgent_deadlines", explanation: true, placeholder_example: "e.g., Urgent instructions were received on [date] requiring [specific work, e.g., preparation for a short-notice hearing] by [deadline date/time] due to [reason for urgency], necessitating immediate and focused work..." },
        ],
        columns_for_sub_options: 1
    },
    {
        page: 2,
        id: "s1_circumstances",
        title: "LAA Threshold Test: Exceptional Circumstances, Novelty, Weight, or Complexity",
        main_question_text: "Did the case involve exceptional circumstances, novelty, weight, or complexity?",
        main_toggle_id: "s1_circumstances_main_toggle",
        narrative_header_key: "s1_exceptional_circumstances_complexity_header_narrative",
        checkboxes: [
            { label: "Complex legal issues arose", key: "s1_circ_legal_issues", explanation: true, placeholder_example: "e.g., The case involved complex interplay between [legal area 1] and [legal area 2], specifically concerning [the difficult point of law] which required detailed research into..." },
            { label: "Complex questions of expert evidence", key: "s1_circ_expert_evidence", explanation: true, placeholder_example: "e.g., We had to scrutinise and reconcile conflicting expert reports from [number] experts in [fields, e.g., paediatric neurology and psychology] concerning [the core issue of contention]..." },
            { label: "Significant other evidential issues", key: "s1_circ_evidential_issues", explanation: true, placeholder_example: "e.g., Significant evidential challenges included [e.g., tracing a key witness who had moved abroad / obtaining disclosure of historic, poorly archived records] which demanded..." },
            { label: "Difficulty in taking instructions (client/witnesses)", key: "s1_circ_difficult_instructions", explanation: true, placeholder_example: "e.g., The client's [e.g., trauma / learning disability / distrust of authority] made obtaining a coherent history and instructions exceptionally challenging, requiring multiple attendances and..." },
            { label: "Exceptional impact of issues on client (liberty, housing etc.)", key: "s1_circ_client_impact", explanation: true, placeholder_example: "e.g., The proceedings had a profound impact on the client's [e.g., fundamental right to family life / risk of homelessness / deportation], making the stakes exceptionally high and requiring sensitive handling of..." },
            { label: "Substantial and unavoidable out-of-hours work", key: "s1_circ_out_of_hours", explanation: true, placeholder_example: "e.g., Substantial work was unavoidably performed outside normal hours on [e.g., weekend of date / evenings of dates] to [reason, e.g., prepare for an emergency hearing / meet an unexpected court deadline]..." },
            { label: "Novel points of law or unique factual matrix", key: "s1_circ_novelty", explanation: true, placeholder_example: "e.g., This case presented a novel point of law concerning [specific novel issue, e.g., the application of a new statutory instrument to shared care arrangements] for which there was no existing precedent..." },
            { label: "Exceptional weight (documentation volume / number of issues)", key: "s1_circ_weight_volume", explanation: true, placeholder_example: "e.g., The sheer volume of disclosure, exceeding [e.g., 10 lever arch files / 2000 pages], related to [type of documents] and required an exceptional amount of time to review and schedule for..." },
        ],
        columns_for_sub_options: 1
    },
    // PAGE 3 Content Blocks (Stage 2)
    {
        page: 3,
        id: "s2_responsibility",
        title: "Determining Level of Enhancement: Degree of Responsibility",
        narrative_header_key: "s2_responsibility_header_narrative",
        checkboxes: [
            { label: "Significant analysis/planning without Counsel", key: "s2_resp_no_counsel_analysis", explanation: true, placeholder_example: "e.g., The fee earner undertook all significant case analysis and strategic planning, including [e.g., identifying key legal arguments / devising the evidential strategy], without recourse to Counsel, which is unusual for a case of this complexity involving..." },
            { label: "Complex drafting without Counsel", key: "s2_resp_no_counsel_drafting", explanation: true, placeholder_example: "e.g., Complex drafting of [e.g., a detailed Threshold Agreement / a nuanced position statement addressing multiple allegations] was handled entirely by the fee earner due to..." },
            { label: "Advocacy undertaken without Counsel", key: "s2_resp_no_counsel_advocacy", explanation: true, placeholder_example: "e.g., The fee earner conducted advocacy at the [e.g., contested interim hearing / directions hearing involving complex legal argument] which might typically have been briefed to Counsel because..." },
            { label: "Addressed expert/evidential issues (reducing expert/Counsel need)", key: "s2_resp_addressed_expert_issues", explanation: true, placeholder_example: "e.g., By meticulously [e.g., cross-referencing medical records with witness statements / researching technical financial data], the fee earner was able to address [specific expert/evidential issue] directly, thereby avoiding the need and cost of instructing a separate expert in..." },
        ],
        columns_for_sub_options: 1,
        depends_on_threshold_met: true
    },
    {
        page: 3,
        id: "s2_care_economy",
        title: "Determining Level of Enhancement: Care, Speed & Economy",
        narrative_header_key: "s2_care_speed_economy_header_narrative",
        checkboxes: [
            { label: "Exceptional care/skill in case management/presentation", key: "s2_cse_care_skill", explanation: true, placeholder_example: "e.g., Exceptional care was demonstrated in the [e.g., preparation of the trial bundle, ensuring every document was correctly paginated and cross-referenced / meticulous preparation of the client for giving evidence] which contributed to..." },
            { label: "Particular care with vulnerable client", key: "s2_cse_care_vulnerable_client", explanation: true, placeholder_example: "e.g., Particular sensitivity and adapted communication techniques were employed when dealing with the client's [vulnerability, e.g., recent bereavement / diagnosed PTSD], ensuring they felt supported and understood throughout..." },
            { label: "Work conducted with exceptional speed (as per Stage 1)", key: "s2_cse_speed", explanation: true, placeholder_example: "e.g., As detailed in Stage 1, the proactive steps taken to [reiterate speed point, e.g., secure the emergency injunction] resulted in a swift and positive outcome for the client, which demonstrated..." },
            { label: "Exceptional economy (less time/disbursements claimed)", key: "s2_cse_economy_efficiency", explanation: true, placeholder_example: "e.g., By [e.g., front-loading negotiations / proposing a streamlined directions timetable that was adopted by the court], the case was resolved more efficiently, likely saving [X hours / specific costs] compared to a more protracted approach, because..." },
        ],
        columns_for_sub_options: 1,
        depends_on_threshold_met: true
    },
    {
        page: 3,
        id: "s2_novelty_weight_complexity",
        title: "Determining Level of Enhancement: Novelty, Weight & Complexity",
        narrative_header_key: "s2_novelty_weight_complexity_header_narrative",
        checkboxes: [
            { label: "Novel points of law or legal context (as per Stage 1)", key: "s2_nwc_novelty_law", explanation: true, placeholder_example: "e.g., The novel legal arguments surrounding [reiterate novelty point from Stage 1, if applicable, or new point] required the fee earner to undertake extensive research and careful formulation of submissions as there was little direct authority on..." },
            { label: "Exceptional weight (docs/issues) (as per Stage 1)", key: "s2_nwc_weight_docs_issues", explanation: true, placeholder_example: "e.g., The exceptional weight of the case, stemming from [e.g., the voluminous and highly technical financial disclosure / the multiplicity of interconnected factual allegations], placed a significant burden on the fee earner in terms of analysis and management..." },
            { label: "Overall complexity was exceptional (as per Stage 1)", key: "s2_nwc_complexity_overall", explanation: true, placeholder_example: "e.g., The overall complexity, arising from the combination of [e.g., international elements, conflicting expert evidence, and a vulnerable client with communication difficulties], made this case significantly more demanding than a standard [matter type] case because..." },
        ],
        columns_for_sub_options: 1,
        depends_on_threshold_met: true
    }
];

// --- HELP TEXTS (Markdown format) ---
const MAIN_HELP_TEXT_MARKDOWN = `
# Understanding LAA Enhancements

This tool helps solicitors provide structured information for claiming an enhancement (uplift) on hourly rates in Legal Aid Agency (LAA) family cases. Enhancements are for work that is **exceptional.**


**Contents:**
*   How This Tool Works & Data Privacy
*   When to Consider an Enhancement Claim
*   The LAA's Two-Stage Process for Enhancements
    *   Stage 1: Threshold Test
    *   Stage 2: Determining the Level of Enhancement
*   Maximum Enhancement Percentages
*   Family Panel Membership
*   How the Percentage is Applied (by the LAA)
*   Using this Tool
*   Acronyms & Key Terms

## How This Tool Works & Data Privacy
This tool is a client-side web application. All data entered by the User is processed locally within the User's web browser.
*   No data entered into the Tool is automatically transmitted to Woodruff Billing Ltd. or any third party via the internet by the Tool itself.
*   The User is solely responsible for saving the PDF summary generated by the Tool and for the secure handling and transmission of this PDF to Woodruff Billing Ltd.


## When to Consider an Enhancement Claim
LAA enhancements are not designed for every legally aided family case. The LAA's Costs Assessment Guidance (CAG) explicitly states that for the threshold test, "the case must be viewed as **exceptional** in one of the ways referred to..." (CAG 12.8, emphasis added). The guidance further clarifies that the comparison is "with the generality of legally aided proceedings to which the prescribed rates apply" (CAG 6.17).

Before using this tool, critically assess if the case truly stands out due to:
*   Exceptional Competence, Skill, or Expertise
*   Exceptional Speed
*   Exceptional Circumstances, Novelty, Weight, or Complexity

Routine difficulties or standard complexities inherent in many family law cases will not typically meet the 'exceptional' threshold. Over-claiming or providing weak justifications can undermine the credibility of future enhancement claims. This tool should be used to robustly document instances where the work *genuinely* meets the LAA's high bar for exceptionality, justifying a claim beyond standard remuneration.

This tool helps solicitors provide structured information for claiming an enhancement (uplift) on hourly rates in Legal Aid Agency (LAA) family cases. Enhancements are for work that is **exceptional.**


## The LAA's Two-Stage Process for Enhancements:

### Stage 1: Threshold Test (CAG Section 12.4)
First, the work must meet **at least ONE** of these primary criteria to qualify for *any* enhancement:
Tick the main question for a category if it applies, then select specific reasons below it and provide a brief explanation (approx. 10+ words) for each ticked reason.

1.  **Exceptional competence, skill, or expertise:**
    *   The fee earner demonstrates unusually detailed knowledge.
    *   Skilfully pursues an unusual or difficult legal argument.
    *   Shows unusual skill in marshalling evidence.
    *   Identifies a particularly effective tactic.
    *   Completes work in less time than expected.
    *   Achieves a better result than usually expected.
    *   Shows exceptional skill with a vulnerable client (e.g., child, serious mental illness, learning disabilities).
    *(LAA Costs Assessment Guidance (CAG) Section 12.8.1)*

2.  **Exceptional speed:**
    *   The fee earner proactively pursues the case to a swift resolution (e.g., obtaining re-housing, injunctions).
    *   Undertakes substantial work at very short notice due to urgent deadlines (e.g., deportation, urgent hearings).
    *(CAG Section 12.8.2)*

3.  **Exceptional circumstances, novelty, weight, or complexity:**
    *   This can include: complex legal or evidential issues, difficulty taking instructions, issues of exceptional impact to the client (liberty, safety from domestic violence, housing security, avoiding destitution), substantial and unavoidable out-of-hours work, novel points of law or unique factual matrix, or exceptional weight due to volume of documents or number of issues.
    *(CAG Section 12.8.3)*

---
### Stage 2: Determining the Level of Enhancement (CAG Section 12.5 & 12.9)
If the Stage 1 threshold test is met (i.e., you've indicated the case qualifies by selecting and explaining at least one Stage 1 factor), these Stage 2 sections will allow you to detail factors that justify the *percentage* of enhancement that might be claimed. Provide explanations (approx. 10+ words) for each selected factor.

1.  **Degree of responsibility accepted by the fee earner:**
    *   Extent of work done without recourse to Counsel (e.g., analysis, planning, drafting, advocacy).
    *   Addressing issues that might otherwise have required separate expert instruction or more extensive Counsel involvement.
    *(CAG Section 12.9(a))*

2.  **Care, speed, and economy:**
    *   **Care:** Skill in doing work, particular care shown to vulnerable clients.
    *   **Speed:** As in Stage 1.
    *   **Economy/Efficiency:** A reward for claiming less time or disbursements due to effective work or good planning.
    *(CAG Section 12.9(b))*

3.  **Novelty, weight, and complexity of the case:**
    *   As in Stage 1, these factors also influence the *amount* of uplift.
    *(CAG Section 12.9(c))*

---
## Maximum Enhancement Percentages (CAG Section 12.2):
*   **Up to 50%** for most cases (e.g., Family Court, County Court).
*   **Up to 100%** for cases in the High Court, Upper Tribunal, Court of Appeal, or Supreme Court.

## Family Panel Membership (CAG Section 12.20-12.23):
*   A **guaranteed minimum enhancement of 15%** may be applicable (if fee earner name provided & panel selected) for work by fee earners on specific Law Society or Resolution panels.
*   This is a *minimum*; if the general criteria above justify a higher percentage, that higher percentage would be claimed. It is **NOT** in addition to an enhancement claimed under the general criteria.

## How the Percentage is Applied (by the LAA):
The enhancement percentage is assessed holistically by the LAA. Higher percentages are justified when multiple factors are strongly present. A single, very strong factor can also justify a significant enhancement (CAG 12.10). The information you provide here helps Woodruff Billing Ltd build a strong narrative.

---
## Using this Tool:
1.  Complete **Page 1: Case Details & Panel Membership**.
2.  Proceed to **Page 2: Stage 1 - Threshold Test**. Tick the main category if it applies, then select specific reasons and **provide a brief explanation for each ticked reason.**
3.  If the Stage 1 threshold is met, you will proceed to **Page 3: Stage 2 - Level of Enhancement**. Provide explanations for each factor selected.
4.  On **Page 4: Statement Review**, review your selections and explanations.
5.  Proceed to **Page 5: Finalise & Download**. Enter your **Proposed Uplift %**.
6.  Click **"Download PDF Summary"**. This PDF should be sent to Woodruff Billing Ltd.
7.  The "Download PDF Summary" button will only be enabled if all required explanations for ticked items are provided (approx. 10+ words) and mandatory case details are filled.

## Acronyms & Key Terms <!-- ADDED SECTION -->

> **Acronyms**
>
> LAA CAG - refers to the Legal Aid Agency's Costs Assessment Guidance.
>
> Spec - refers to the 2018 Standard Civil Contract Specification.

`;

const UPLIFT_PERCENTAGE_GUIDANCE_TEXT = `
# Guidance on Determining Your Proposed Uplift Percentage

As the solicitor, you are best placed to assess the exceptionality of the work. The percentage you propose will be considered by Woodruff Billing Ltd when compiling the final claim.

The "Suggested: X%" figure displayed on the final page is a **very rough illustration** based on a simple "5% per factor" rule of thumb some practitioners use for initial estimation. **It is NOT an official LAA calculation method.** Your professional judgment, based on the LAA's detailed criteria and the specifics of your case, is paramount.

### 1. First, ensure the Stage 1 Threshold is Met:
   *   The work must genuinely meet at least ONE of the three primary LAA threshold criteria (Exceptional competence/skill/expertise; Exceptional speed; OR Exceptional circumstances/novelty/weight/complexity) **and be properly explained**.
   *   If not, an enhancement is likely not appropriate.

### 2. Consider Stage 2 Factors for the Level (%):
   If Stage 1 is met, the following factors (detailed in the main Help / Info) influence the percentage. Ensure these are also well-explained if selected.
   *   **Degree of Responsibility**
   *   **Care, Speed, and Economy**
   *   **Novelty, Weight, and Complexity**

### 3. LAA's Holistic View & Caps:
   *   The LAA states (CAG 12.10): Higher uplift levels are likely if more Stage 2 factors are strongly present. "A maximum enhancement could be payable on the basis of one factor alone where it is particularly strong."
   *   **Consider these bands as a general guide for your proposal:**
        *   **10-25%:** One or two Stage 2 factors notably present; work demonstrably harder than average.
        *   **25-50%:** Several Stage 2 factors strongly present, or one/two exceptionally strong. Work significantly challenging, requiring high expertise/resilience. (This is often the practical cap for non-High Court work unless truly extraordinary).
        *   **50%-75%+ (up to 100% in higher courts):** Multiple factors met to an exceptionally high degree. Work extraordinarily demanding, complex, immense responsibility, perhaps groundbreaking. (Needs very robust justification).
   *   **LAA Caps (CAG 12.2):** Remember the LAA's own maximums:
        *   Up to **50%** (Family Court, County Court).
        *   Up to **100%** (High Court, Upper Tribunal, Court of Appeal, Supreme Court).

### 4. Family Panel Membership (CAG Section 12.20-12.23):
   *   If you've selected a panel membership and provided the Fee Earner's name, a 15% uplift is a guaranteed minimum *if an enhancement is otherwise justified by meeting the Stage 1 threshold*.
   *   If your assessment of Stage 1 & 2 factors justifies more than 15%, propose that higher figure. The panel membership supports the underlying claim for expertise.

### 5. Proportionality and Reasonableness:
   *   The key is whether the proposed percentage is reasonable and proportionate given the *specific exceptional work you've explained*.
   *   Focus on the *strength* and *relevance* of each point, supported by your explanations.

**Your Input is Crucial:**
The explanations you provide in this form for each ticked criterion are vital. They form the basis of the justification Woodruff Billing Ltd will use. Ensure they are detailed enough (approx. 10+ words is a good guideline).
`;

// --- CONTEXTUAL HELP TEXTS ---
const CONTEXTUAL_HELP_TEXTS = {
    matterTypeHelp: {
        title: "Help: Matter Type",
        content: `
Select the primary category of legally aided work this uplift data capture relates to.
This helps categorize the work for internal processing and can sometimes influence how enhancement arguments are framed. Examples:

*   **Care & Supervision:** Public law Children Act proceedings instigated by the Local Authority (s.31 CA89).
*   **Care & Supervision - High Court:** As above, but where the proceedings are heard in the High Court.
*   **Other Public Law:** Includes applications like Emergency Protection Orders, Secure Accommodation Orders, or other public law children matters not under s.31 (e.g., adoption related to care).
*   **Private Law Family:** Disputes between private individuals concerning children (e.g., Child Arrangements Orders for contact/residence, Specific Issue, Prohibited Steps).
*   **Private Law Finance:** Financial remedy proceedings ancillary to divorce/dissolution of civil partnership, or Schedule 1 Children Act financial provision claims.
*   **Domestic Abuse:** Applications for Non-Molestation Orders or Occupation Orders under the Family Law Act 1996.
*   **Adoption / Placement (Post 01/10/07):** Specific to adoption proceedings or placement orders made after this date.
*   **Other Public Law - High Court:** As "Other Public Law" but heard in the High Court.

If unsure, select the closest match or consult Woodruff Billing Ltd.
        `
    },
    finalUpliftHelp: {
        title: "Help: Proposed Uplift Percentage",
        content: UPLIFT_PERCENTAGE_GUIDANCE_TEXT // Reuses the detailed uplift guidance
    },
    persuasiveArgumentsHelp: {
        title: "Help: Crafting Persuasive Uplift Arguments",
        content: `
### Key Principles for Persuasive Arguments:

*   **Be Specific:** Avoid generic statements. Quantify where possible (e.g., "reviewed 500 pages of evidence," "hearing lasted 3 hours longer than scheduled," "researched obscure 19th-century case law for 2 hours").
*   **Link Directly to LAA Criteria:** Explicitly state which LAA criterion (e.g., "exceptional competence," "unusual complexity," "degree of responsibility") your point supports. Refer to specific sub-points if applicable.
*   **Focus on 'Exceptional':** Clearly explain *why* the work undertaken, or the circumstances faced, were beyond the normal scope, difficulty, or expectation for a fee earner of your level handling a case of this type. What made it stand out?
*   **Show, Don't Just Tell:** Provide concrete examples and details of the skill, complexity, speed, or responsibility. Instead of "complex legal issues," state "complex legal issues regarding the interplay of international relocation conventions and domestic wardship."
*   **Detail the Impact:** Describe how the exceptional work, skill, or circumstance positively impacted the case outcome, the client's position, or the efficiency of proceedings.
*   **Brevity and Clarity:** Be concise but ensure all necessary justifying details are present. Use clear, professional language. Avoid jargon where simpler terms suffice.
*   **Consistency and Evidence:** Ensure your explanations are consistent with the evidence available on the case file. The narrative here flags points for the detailed LAA submission, which will be cross-referenced with file notes.
*   **Cumulative Effect:** If multiple factors apply, briefly note how they compounded the exceptional nature of the work.
        `
    }
};

const TERMS_AND_CONDITIONS_MARKDOWN = `
**Terms & Conditions of Use: Woodruff Billing Ltd. Uplift Justification Collator**

1.  **Purpose & Intended Use:** This Uplift Justification Collator tool ("the Tool") is provided by Woodruff Billing Ltd. for the exclusive use of its solicitor clients ("Users"). The Tool is designed to assist Users in structuring information and justifications for claiming enhancements on hourly rates in legally aided family law cases for submission to Woodruff Billing Ltd.

2.  **Data Handling & Privacy:**
    *   The Tool is a client-side web application. All data entered by the User is processed locally within the User's web browser.
    *   No data entered into the Tool is automatically transmitted to Woodruff Billing Ltd. or any third party via the internet by the Tool itself.
    *   The User is solely responsible for saving the PDF summary generated by the Tool and for the secure handling and transmission of this PDF to Woodruff Billing Ltd.

3.  **Accuracy of Information:**
    *   The User is solely responsible for the accuracy, completeness, and veracity of all information and justifications entered into the Tool and subsequently provided to Woodruff Billing Ltd. via the generated PDF.
    *   Woodruff Billing Ltd. relies on the information provided by the User and is not responsible for verifying the accuracy of User-supplied data at the input stage through this Tool.

4.  **'Suggested Uplift %':** The "Suggested Uplift %" feature within the Tool provides an illustrative figure based on a predefined, simplified logic. This is **not** an official Legal Aid Agency (LAA) calculation, nor is it a guarantee of the uplift percentage that will be claimed by Woodruff Billing Ltd. or awarded by the LAA. The final uplift percentage claimed will be determined by Woodruff Billing Ltd. after a full review of the case and the information provided.

5.  **Output (PDF Summary):** The PDF summary generated by the Tool is a collation of the User's inputs. This PDF will be used by Woodruff Billing Ltd. as a basis for preparing the detailed LAA narrative for the enhancement claim.

6.  **No Guarantee of Outcome:** Use of this Tool does not guarantee a successful enhancement claim or any specific level of uplift. All claims are subject to assessment by the LAA according to their current guidance and regulations.

7.  **Intellectual Property:** This Tool is the property of Woodruff Billing Ltd.

8.  **Limitation of Liability:** Woodruff Billing Ltd. shall not be liable for any errors or omissions in the information entered by the User, nor for any decisions made based on the illustrative "Suggested Uplift %".

9.  **Acceptance of Terms:** By using this Tool, Users agree to these Terms & Conditions.

*${LAA_GUIDE_VERSION_INFO_CONST}*
`;