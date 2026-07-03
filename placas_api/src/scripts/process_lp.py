from ultralytics import YOLO
from pathlib import Path
import torch
import cv2
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image, ImageOps
import pandas as pd
import imageio


from torchvision import transforms
from torchvision.transforms import v2
from torchvision.datasets import ImageFolder

from torchvision import models

import torch
from torch import nn

classes = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
cls2index = {'0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17, 'I': 18, 'J': 19, 'K': 20, 'L': 21, 'M': 22, 'N': 23, 'P': 25, 'Q': 26, 'R': 27, 'S': 28, 'T': 29, 'U': 30, 'V': 31, 'W': 32, 'X': 33, 'Y': 34, 'Z': 35}
index2cls = {0: '0', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: 'A', 11: 'B', 12: 'C', 13: 'D', 14: 'E', 15: 'F', 16: 'G', 17: 'H', 18: 'I', 19: 'J', 20: 'K', 21: 'L', 22: 'M', 23: 'N', 25: 'P', 26: 'Q', 27: 'R', 28: 'S', 29: 'T', 30: 'U', 31: 'V', 32: 'W', 33: 'X', 34: 'Y', 35: 'Z'}

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def process_license_plate(image):
    '''
    Process a license plate image using a pre-trained model.
    
    Args:
        image (PIL.Image): The input image to process.
    
    Returns:
        str: A string containing the predicted license plate.
    '''

    detection_model = YOLO(Path(".","src","models","detection","best.pt"))
    
    state_dict = torch.load(Path(".","src","models","classification","best_model.pth"), map_location='cpu')
    classification_model = models.resnet18(pretrained=False)
    num_ftrs = classification_model.fc.in_features
    classification_model.fc = nn.Linear(num_ftrs, len(classes))
    classification_model.load_state_dict(state_dict)
    classification_model = classification_model.to(device)
    classification_model.eval()

    results = detection_model(image)

    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy() 
        
        image_rgb = np.array(image.copy())

        transform = transforms.Compose([
            # transforms.Lambda(lambda x: Image.fromarray(x.astype(np.uint8))),
            # v2.RandomResizedCrop(size=(28, 28), antialias=True),
            v2.Resize(size=(128, 128)), # (28,28)
            transforms.ToTensor(),
            transforms.Lambda(lambda x: x.repeat(3, 1, 1) if x.size(0) == 1 else x),  # Convert grayscale to RGB
            transforms.Normalize(mean=[0., 0., 0.], std=[1., 1., 1.])  # ImageNet stats
        ])
        
        if len(boxes) > 0:
            x1, y1, x2, y2 = map(int, boxes[0]) 
            
            cropped = image_rgb[y1:y2, x1:x2]
            cropped_gray = cv2.cvtColor(cropped.copy(), cv2.COLOR_RGB2GRAY)
            blurred = cv2.GaussianBlur(cropped_gray, (5, 5), 0)
            
            # thresh = cv2.adaptiveThreshold(
            #     blurred, 255, 
            #     cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            #     cv2.THRESH_BINARY_INV, 91, 5
            # )
            _, thresh = cv2.threshold(
                blurred, 0, 255, 
                cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
            )

            # temp = image_rgb.copy()
            # cv2.rectangle(temp, (x1, y1), (x2, y2), (0, 255, 0), 2)

            # plt.imshow(cropped_gray, cmap='grey')
            # plt.show()

            thresh_invertido = cv2.bitwise_not(thresh)
            
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            morph = cv2.morphologyEx(thresh_invertido, cv2.MORPH_CLOSE, kernel)
            morph = cv2.morphologyEx(morph, cv2.MORPH_OPEN, kernel)

            # plt.imshow(morph, cmap='grey')
            # plt.show()
            
            contours, _ = cv2.findContours(morph, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
            
            if not contours:
                # print("No contours found")
                return "No contours found"
            
            height, width = cropped_gray.shape
            center_x, center_y = width // 2, height // 2
            
            char_contours = []
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                area = cv2.contourArea(contour)
                aspect_ratio = w / float(h) if h > 0 else 0
                
                contour_center_x = x + w//2
                contour_center_y = y + h//2

                altura_minima = height * 0.30
                altura_maxima = height * 0.90

                # print('---->',area, h)

                
                
                # if (500 < area < 5000 and  
                #     0.3 < aspect_ratio < 0.8 and  
                #     abs(contour_center_x - center_x) < width * 0.4 and  
                #     abs(contour_center_y - center_y) < height * 0.3): 
                if ((altura_minima < h and h < altura_maxima)  and  
                    (0.15 < aspect_ratio < 0.9) and  
                    abs(contour_center_x - center_x) < width * 0.4 and  
                    abs(contour_center_y - center_y) < height * 0.3): 
                    
                    char_contours.append(contour)

                    
            
            if not char_contours:
                return "No character contours found"
            
            if not char_contours:
                return "No central characters found"
                
            boxes = [cv2.boundingRect(c) for c in char_contours]
            
            heights = [h for (_, _, _, h) in boxes]
            median_height = np.median(heights)
            
            filtered_boxes = []
            for box in boxes:
                x, y, w, h = box

                if 0.85 * median_height <= h <= 1.15 * median_height:
                    filtered_boxes.append(box)
            
            if not filtered_boxes:
                return "No valid character boxes found after height filtering"
                
            filtered_boxes.sort(key=lambda b: b[0])
            
            y_centers = [y + h/2 for (_, y, _, h) in filtered_boxes]
            y_center = np.median(y_centers)
            
            aligned_boxes = []
            aligned_boxes = filtered_boxes
            # print('->',filtered_boxes)
            # for box in filtered_boxes:
            #     x, y, w, h = box
            #     box_center = y + h/2

            #     # temp = cropped.copy()
            #     # cv2.rectangle(temp, (x, y), (x + w, y + h), (0, 255, 0), 2)
            #     # plt.imshow(temp)
            #     # plt.show()

            #     print(box_center, y_center, abs(box_center - y_center), 0.15 * median_height)

            #     if abs(box_center - y_center) < 0.15 * median_height:
            #         aligned_boxes.append(box)
            
            if not aligned_boxes:
                return "No vertically aligned characters found"

            
            predicted_letters = []
            for box in aligned_boxes:
                x, y, w, h = box
                char_image = cropped[y-3:y+h+3, x-3:x+w+3]

                char_image = cv2.cvtColor(char_image, cv2.COLOR_RGB2GRAY)    

                x = transform(Image.fromarray(char_image).convert('L'))
                
                x = x.unsqueeze(0).to(device)

                output = classification_model(x)
                # print(output.size())
                _, pred = torch.max(output, 1)
                

                predicted_letters.append(classes[pred.cpu().item()])

                # print(predicted_letters)
            
            return "".join(predicted_letters)  




if __name__ == "__main__":
    img = imageio.v3.imread('placas-mercosul-1920x1080.png')
    # img = ImageOps.exif_transpose(img)
    print(np.shape(img))
    # plt.imshow(img)
    # plt.show()
    print(process_license_plate(img))